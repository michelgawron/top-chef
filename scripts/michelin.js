/**
 * Created by M2469215 on 16/02/2018.
 * This module is used to get restaurants from the michelin website
 */
var exports = module.exports = {};

let cheerio = require('cheerio');
let request = require('request');

let headers = {
    'User-Agent': '\\"curl\\"',
    Cookie: '\\"has-js=1\\"'
};

//TODO Add function to help format our urls

/**
 * Get restaurants from michelin site
 * @param url
 */
async function getRestaurants(url) {
    return new Promise(function (resolve, reject) {
        getNumberPages(url)
            .then(pages => {
                /*
                 * Controls the pages value and define a default one if we got an error or no more than a single page
                 */
                if (pages === "null") {
                    pages = 1;
                }
                return pages;
            })
            .then(pages => {
                /*
                 * Creates all the urls we need to scrape (every page from the first to the last one for our query) from
                 * a base one
                 */
                let myurl = "https://restaurant.michelin.fr/search-restaurants?" +
                    "&cooking_type=&gm_selection=&stars=&bib_gourmand=" +
                    "&piecette=&michelin_plate=&services=&ambiance=" +
                    "&booking_activated=&min_price=&max_price=" +
                    "&number_of_offers=&prev_localisation=1424&latitude=" +
                    "&longitude=&bbox_ne_lat=&bbox_ne_lon=&bbox_sw_lat=&bbox_sw_lon=" +
                    "&page_number=PAGENUMBERHERE&op=Rechercher&js=true";
                let tabUrls = [];

                for (let i = 1; i <= pages; i++) {
                    tabUrls.push(encodeURI(myurl.replace("PAGENUMBERHERE", i)));
                }

                return tabUrls;
            })
            .then(tabUrls => {
                /*
                 * Now that we got all the urls we need to scrape, we are going to create a promise for every sub-batch
                 * In order to scrape every url asynchronously - each batch contains 10 urls
                 * Returns a list of promises
                 * Each promise is going to return a single list of restaurants that it has scraped
                 */
                let tabPromises = [];
                let nbUrls = 10;

                for (let i = 0; i < (tabUrls.length) / nbUrls; i++) {
                    // Creating a sub-batch
                    let subset = tabUrls.slice(i * nbUrls, (i + 1) * nbUrls);

                    // Creating a promise that will process a batch of urls and return its restaurants
                    let promise = processBatch(subset).then(async html => {
                        console.log("Pushing batch number " + i);
                        let tabResult = [];

                        // Getting relevant information upon completion of the request and pushing it to a result array
                        for (let i = 0; i < html.length; i++) {
                            let json_object = JSON.parse(html[i])[1]["settings"]["search_result_markers"];

                            // Going through all the found restaurants
                            for (let key in json_object) {
                                if (json_object.hasOwnProperty(key)) {
                                    tabResult.push({
                                        "title": json_object[key]['title'],
                                        "url": json_object[key]['content_url']
                                    });
                                }
                            }
                        }
                        return tabResult;
                    });
                    tabPromises.push(promise);
                }
                return tabPromises;
            })
            .then(tabPromises => {
                /*
                 * The last part of our promise chain executes all the previously created promises
                 * Our module waits for the completion of all our requests, concatenate the lists of restaurants
                 * And call the completion function
                 */
                let tabResult = [];
                Promise.all(tabPromises).then((resultsBatches) => {
                    let results = Array.prototype.concat.apply([], resultsBatches);
                    resolve(results);
                });
            });
    });
}

/**
 * Process a small batch of data synchronously (one url at a time)
 * @param batch
 * @returns {Promise<Array>}
 */
function processBatch(batch) {
    return new Promise(async(resolve, reject) => {
        let resultBatch = [];
        for (let i = 0; i < batch.length; i++) {
            await processURL(batch[i]).then(x => resultBatch.push(x));
        }
        resolve(resultBatch);
    });
}


/**
 * Process a single url and retrieve html code
 * @param url
 * @returns {Promise<any>}
 */
async function processURL(url) {
    return new Promise(function (resolve, reject) {
        request(url, {headers: headers}, function (error, response, html) {
                if (!error) {
                    resolve(html);
                }
                else {
                    console.log(error)
                }
            }
        )
    });
}

/**
 * Use cheerio to get the number of pages in our
 * @param url
 */
let getNumberPages = async function (url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, html) {
            // If we get a response without error
            if (!error && response.statusCode === 200) {
                $ = cheerio.load(html);

                /*
                 * Getting the last page for this request as follows:
                 * We select the last item of the pagination list, and then get to the previous one
                 * which represents the value of the last page
                 */
                console.log("test");
                resolve($('.mr-pager-first-level-links').children('.last').prev().text());
            }
        })
    })
};

exports.getRestaurants = getRestaurants;