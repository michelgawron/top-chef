/**
 * Created by M2469215 on 16/02/2018.
 * This module is used to get restaurants from the michelin website
 */
var exports = module.exports = {};

let cheerio = require('cheerio');
let request = require('request');

// Default base URL used to scrape lafourchette - api url returning json
let baseLFURL = "https://m.lafourchette.com/api/restaurant/search?sort=QUALITY" +
    "&offer=1" +
    "&search_text=YOURSEARCHQUERYHERE" +
    "&offset=YOUROFFSETHERE" +
    "&origin_code_list[]=THEFORKMANAGER" +
    "&origin_code_list[]=TRIPADVISOR";

// Creating default header for la fourchette website
let headersLaFourchette = {
    'User-Agent': '\\"Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko\\"'
};

/**
 * Process the whole batch of restaurants given by michelin
 * @param batch
 * @returns {Promise}
 */
async function processRestaurants(batch) {
    return new Promise(async function (resolve, reject) {
        let tabResult = [];

        let nbUrls = 100;

        // Process 100 by 100
        for (let i = 0; i < batch.length / nbUrls; i++) {
            console.log("BATCH LAFOURCHETTE : " + i);
            await processBatch(batch.slice(i * nbUrls, (i + 1) * nbUrls))
                .then(result => {
                    tabResult.push(result)
                });
        }
        let tabFinal = Array.prototype.concat.apply([], tabResult);
        resolve(tabFinal);
    })
}

/**
 * Process a sub-batch given by our functions
 * @param batch
 * @returns {Promise<any>}
 */
async function processBatch(batch) {
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
                    let jsonPage = JSON.parse(page);

                    // Case where there is only one element
                    if (jsonPage['pagination']['total'] === 1) {
                        return jsonPage['items'][0];
                    }
                    else if (jsonPage['pagination']['total'] === 0) {
                        throw "0 RESULT ERROR";
                    }
                    // Case where we got several elements
                    else {
                        // Get postal code from michelin then select the right restaurant
                        return getPostalCode(batch[i])
                            .then(postalCode => {
                                // Selecting a restaurant thanks to its postal code
                                return selectRestaurant(jsonPage["items"],
                                    batch[i]['title'], postalCode, 0, jsonPage['pagination']['total'])
                                    .then(restaurant => {
                                        return restaurant;
                                    });
                            });
                    }
                })
                .then(restaurantJSON => {
                    /**
                     * Send a request to the restaurant url and load html
                     */
                    return getElementsFromJSON(restaurantJSON);
                })
                .catch(error => {
                    /**
                     * If we catch an error here, that means the restaurant name returns no result on la fourchettte
                     */
                    return "ERROR";
                });
            arrPromise.push(promise);
        }

        Promise.all(arrPromise)
            .then(result => {
                /*
                 * We are going to delete error elements from our array
                 */
                let arrResultNotNull = [];
                for (let i = 0; i < result.length; i++) {
                    let obj = result[i];
                    if (obj !== 'ERROR') {
                        arrResultNotNull.push(obj);
                    }
                }
                resolve(arrResultNotNull);
            })

    });
}

/**
 * Gets elements from a restaurant's JSON
 * @param restaurantJSON
 */
function getElementsFromJSON(restaurantJSON) {
    let imageUrl = "";
    if (restaurantJSON['images']['main'] === undefined) {
        // Undefined image url
        imageUrl = "";
    }
    else {
        imageUrl = restaurantJSON['images']['main'][restaurantJSON['images']['main'].length - 1]['url'];
    }
    return {
        "name": restaurantJSON['name'],
        "address": {
            "city": restaurantJSON['address']['address_locality'],
            "postal_code": restaurantJSON['address']['postal_code'],
            "street": restaurantJSON['address']['street_address']
        },
        "rating": restaurantJSON['aggregate_rating']['rating_value'],
        "rating_count": restaurantJSON['aggregate_rating']['rating_count'],
        "avg_price": restaurantJSON['average_price'],
        "sale_title": restaurantJSON['sale_type']['title'],
        "sale_menus": restaurantJSON['sale_type']['menus'],
        "speciality": restaurantJSON['speciality'],
        "img_url": imageUrl,
        "tags": restaurantJSON['restaurant_tags_ids'],
        "tripadvisor_rating": restaurantJSON['trip_advisor']
    };
}

/**
 * Process a restaurant being given its batch
 * @param dictRestaurant Dict containing the restaurant name and its url
 * @returns {Promise<void>} Page's html
 */
async function getFirstPage(dictRestaurant) {
    return new Promise(function (resolve, reject) {
        // Creating url with the restaurants name and offset = 0
        let baseUrl = encodeURI(baseLFURL
            .replace("YOURSEARCHQUERYHERE", dictRestaurant["title"].toLowerCase().replace("&", ""))
            .replace("YOUROFFSETHERE", "0"));

        request(baseUrl, {headers: headersLaFourchette, followRedirect: false}, function (error, response, html) {
            if (!error && response.statusCode === 200) {
                // Got a response - resolving the promise and sending the page
                resolve(html);
            }
            else if (!error) {
                // Got no response - rejecting promise with the code error
                reject(response.statusCode);
            }
            else {
                reject(error);
            }
        });
    });
}

/**
 * If we got multiple results, selecting the one which address contains our postalCode
 * @param restaurantsJSON list of JSON string containing info about restaurants
 * @param name Name of the restaurant
 * @param postalCode Postal code of the restaurant
 * @param offset Offset parameter (index on which we search our element)
 * @param maxOffset Number of elements returned by the research
 * @returns {Promise<void>} The url of the restaurant on lafourchette
 */
async function selectRestaurant(restaurantsJSON, name, postalCode, offset, maxOffset) {
    return new Promise(function (resolve, reject) {

        // Variable to store the right restaurants infos
        let myRestaurantJSONString = "";

        for (let i = 0; i < restaurantsJSON.length; i++) {
            // Get the postal code of a restaurant and compare it with the one given by michelin
            if (restaurantsJSON[i]['address']['postal_code'].toString() === postalCode) {
                myRestaurantJSONString = restaurantsJSON[i];
                break;
            }
        }

        // Resolving if we got a result
        if (myRestaurantJSONString !== "") {
            resolve(myRestaurantJSONString)
        }
        else {
            // If we cannot find any result then going to the next page if it exists, throwing error if not
            if (offset + 10 >= maxOffset) {
                reject("NOT FOUND");
            }
            else if (offset > 250) {
                reject("TOO MANY RESTAURANTS");
            }
            else {
                // Getting url and loading the page
                let url = encodeURI(baseLFURL
                    .replace("YOURSEARCHQUERYHERE", name)
                    .replace("YOUROFFSETHERE", offset + 10));

                // Sending a request to load the page and recursively calling this function to process the page
                request(url, {headers: headersLaFourchette, followRedirect: false}, function (error, response, html) {
                    if (!error) {
                        let items = JSON.parse(html)['items'];
                        // Creating a recursive promise chain to resolve/reject the right element
                        return selectRestaurant(items, name, postalCode, offset + 10, maxOffset)
                            .then(JSONRestaurant => {
                                resolve(JSONRestaurant);
                            })
                            .catch(error => {
                                reject(error);
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
            else {
            }
        });
    });
}

exports.processRestaurants = processRestaurants;