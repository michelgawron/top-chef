/**
 * Created by M2469215 on 16/02/2018.
 * This module is used to get restaurants from the michelin website
 */
var exports = module.exports = {};

let cheerio = require('cheerio');
let request = require('request');

let baseLFURL = "https://www.lafourchette.com";

// Creating default header for la fourchette website
let headersLaFourchette = {
    'User-Agent':
        '\\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36\\"',
    Cookie: '\\"datadome=AHrlqAAAAAMAd1qvq6TwyMEAXRqvwA==\\"'
};

function getHTML(restaurantUrl) {
    return new Promise(function (resolve, reject) {
        request(restaurantUrl, {headers: headersLaFourchette}, function (error, response, html) {
            if (!error) {
                resolve(html);
            }
        });
    });
}

/**
 * Process the batch given by the michelin website
 * @param batch
 * @returns {Promise<any>}
 */
async function getRestaurantsLaFourchette(batch) {
    return new Promise(function (resolve, reject) {
        let arrPromise = [];
        // Process each url separately
        for (let i = 0; i < batch.length; i++) {
            // Creating a promise for each url
            let promise = getFirstPage(batch[i])
                .then(page => {
                    /**
                     * Got the first page - lets extract first info from it
                     * This scope extracts the url of the restaurant we searched on lafourchette
                     * Calls the right function according to the number of elements on the page
                     */
                    let $ = cheerio.load(page);

                    // Case where there is only one element
                    if ($('.resultContainer ul').children('.resultItem').length === 1) {
                        return getRestaurantUrl($('.resultContainer ul').children('.resultItem').html());
                    }
                    // Case where we got several elements
                    else {
                        return getPostalCode(batch[i])
                            .then(postalCode => {
                                return selectRestaurantUrl(page, batch[i]['title'], postalCode);
                            });
                    }
                })
                .then(restaurantUrl => {
                    /**
                     * Send a request to the restaurant url and load html
                     */
                    console.log(restaurantUrl);
                    return getHTML(restaurantUrl);
                })
                .then(htmlRestaurant => {
                    /**
                     * Scrape the html of each restaurant and get relevant information
                     */
                    return getElementsFromHTML(htmlRestaurant);
                })
                .catch(error => {
                    /**
                     * If we catch an error here, that means the restaurant name returns no result on la fourchettte
                     */
                    console.log(error);
                })

        }
    });
}

/**
 * Removes unnecessary spaces on our string
 * @param str
 * @param joinChar
 * @returns {string}
 */
function removeSpaces(str, joinChar) {
    return str.split("\n").map(x => {
        return x.trim();
    }).slice(1, -1).join(joinChar)
}

function getElementsFromHTML(htmlPage) {
    let $ = cheerio.load(htmlPage);
    // TODO Test this + add tags
    console.log({
        "title": $('.restaurantSummary-name').text(),
        "address": removeSpaces($('.restaurantSummary-address').text().toString(), " - "),
        "imageAddress": $('.carousel-item').children().attr('src'),
        "phoneNumber": $('.restaurantPhone-number').text(),
        "avgPrice": removeSpaces($('.restaurantSummary-price').text().toString(), " ").trim(),
        "ratingValue": removeSpaces($('#restaurantAvgRating .rating-ratingValue').text(), " "),
        "reviewsCount": removeSpaces($('.reviewsCount').text(), " "),
        "sale": $('.saleType').text(),
        "url": $('meta[property="og:url"]').attr("content")
    });
    return {
        "title": $('.restaurantSummary-name').text(),
        "address": removeSpaces($('.restaurantSummary-address').text().toString(), " - "),
        "imageAddress": $('.carousel-item').children().attr('src'),
        "phoneNumber": $('.restaurantPhone-number').text(),
        "avgPrice": removeSpaces($('.restaurantSummary-price').text().toString(), " ").trim(),
        "ratingValue": removeSpaces($('#restaurantAvgRating .rating-ratingValue').text(), " "),
        "reviewsCount": removeSpaces($('.reviewsCount').text(), " "),
        "sale": $('.saleType').text(),
        "url": $('meta[property="og:url"]').attr("content")
    };
}

/**
 * Process a restaurant being given its batch
 * @param dictRestaurant Dict containing the restaurant name and its url
 * @returns {Promise<void>} Page's html
 */
async function getFirstPage(dictRestaurant) {
    return new Promise(function (resolve, reject) {
        baseUrl = "https://www.lafourchette.com/search-refine/" + dictRestaurant["title"].toLowerCase();
        // followRedirect = false in order not to follow 302 redirection (in case the restaurant was not found
        request(baseUrl, {headers: headersLaFourchette, followRedirect: false}, function (error, response, html) {
            if (!error && response.statusCode === 200) {
                // Got a response - resolving the promise and sending the page
                resolve(html);
            }
            else {
                // Got no response (response code 302) - rejecting promise with the code error
                reject(response.statusCode);
            }
        });
    });
}

/**
 * Function used when we got only one restaurant when searching from michelin
 * @param html
 * @returns {Promise<void>} The url of the restaurant on lafourchette
 */
async function getRestaurantUrl(html) {
    return new Promise(function (resolve, reject) {
        let $ = cheerio.load(html);
        resolve(baseLFURL + $('.resultItem-name').children().attr('href'));
    });
}

/**
 * If we got multiple results, selecting the one which address contains our postalCode
 * @param myPage Page in which we need to find our result
 * @param name Name of the restaurant
 * @param postalCode Postal code of the restaurant
 * @returns {Promise<void>} The url of the restaurant on lafourchette
 */
async function selectRestaurantUrl(myPage, name, postalCode) {
    return new Promise(function (resolve, reject) {
        let $ = cheerio.load(myPage);
        let restaurantUrl = "";

        // Goes through the list of restaurants on the page and selects the right one
        $('.resultContainer ul')
            .children('.resultItem')
            .each(function (i, link) {
                /*
                 * If the address of the restaurant on lafourchette contains our postal code
                 * then setting the value of restaurantUrl to the url of this restaurant
                 */
                if ($(this).find(".resultItem-address").text().toString().includes(postalCode)) {
                    // Getting the url of the restaurant
                    restaurantUrl = baseLFURL + $(this)
                        .find(".resultItem-name")
                        .children()
                        .attr("href");

                    // Breaking each loop
                    return false;
                }
            });

        // Resolving if we got a result
        if (restaurantUrl !== "") {
            resolve(restaurantUrl)
        }
        else {
            // If we cannot find any result then going to the next page if it exists, throwing error if not
            if ($('.pagination .next a').length === 0) {
                reject("NOT FOUND");
            }
            else {
                console.log("Loading next page");
                // Getting url and loading the page
                let url = baseLFURL + $('.pagination .next a').attr("href");

                // Sending a request to load the page and recursively calling this function to process the page
                request(url, {headers: headersLaFourchette, followRedirect: false}, function (error, response, html) {
                    if (!error) {
                        console.log("Loaded");
                        // Creating a recursive promise chain to resolve the right element
                        return selectRestaurantUrl(html, name, postalCode).then(x => {
                            resolve(x);
                        });
                    }
                });
            }
        }
    });
}

/**
 * Function used to get the postal code from michelin website
 * @param dictRestaurant Dict containing the restaurant name and its url
 * @returns {Promise<void>}
 */
async function getPostalCode(dictRestaurant) {
    return new Promise(function (resolve, reject) {
        request(dictRestaurant["url"], function (error, response, html) {
            if (!error) {
                let $ = cheerio.load(html);
                resolve($('.postal-code').text());
            }
        })
    });
}

exports.getFirstPage = getFirstPage;
exports.getPostalCode = getPostalCode;
exports.selectRestaurantUrl = selectRestaurantUrl;
exports.getRestaurantUrl = getRestaurantUrl;
exports.getRestaurantsLaFourchette = getRestaurantsLaFourchette;