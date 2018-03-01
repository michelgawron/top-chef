/**
 * Created by M2469215 on 16/02/2018.
 * This module is used to get restaurants from the michelin website
 */
var exports = module.exports = {};

let cheerio = require('cheerio');
let request = require('request');

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
                     * TODO check if there is only one element or multiple ones and call the right function
                     * TODO If we got multiple restaurants then scrape the postal code from michelin to pass it to the function
                     * TODO Get the pagination
                     */
                })
                .then(restaurantUrl => {
                    /**
                     * Send a request to the restaurant url and load html
                     */
                })
                .then(htmlRestaurant => {
                    /**
                     * Scrape the html of each restaurant and get relevant information
                     */
                })
                .catch(error => {
                    /**
                     * If we catch an error here, that means the restaurant name returns no result on la fourchettte
                     */
                })

        }
    });
}

/**
 * Process a restaurant being given its batch
 * @param batch Dict containing the restaurant name and its detailed infos url
 * @returns {Promise<void>} Page's html
 */
async function getFirstPage(batch) {
    return new Promise(function (resolve, reject) {

    });
}

/**
 * Function used when we got only one restaurant when searching from michelin
 * @param html
 * @returns {Promise<void>} The url of the restaurant on lafourchette
 */
async function getRestaurantUrl(html) {

}

/**
 * If we got multiple results, selecting the one which address contains our postalCode
 * @param html
 * @param name
 * @param postalCode
 * @param nextUrl Url to be visited if we cannot find the right restaurant on the page (no next page = "nullPage")
 * @returns {Promise<void>} The url of the restaurant on lafourchette
 */
async function selectRestaurantUrl(html, name, postalCode, nextUrl) {

}