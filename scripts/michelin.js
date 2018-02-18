/**
 * Created by M2469215 on 16/02/2018.
 * This module is mainly used to get restaurants from hte michelin website
 */
var exports = module.exports = {};
let phantom = require('phantom');
let Xray = require('x-ray');
let x = Xray({
    filters: {
        removeSpace:
            /**
             * Function used in order to remove useless spaces we get when scraping the website
             * @param value
             * @returns {string}
             */
            function (value) {
                // Replacing \n characters
                value = value.replace("\n", "");

                // Removing head spaces
                while (value.charAt(0) === " ") {
                    value = value.substring(1);
                }

                // Reversing the string
                value = value.split("").reverse().join("");

                // Removing tail spaces
                while (value.charAt(0) === " ") {
                    value = value.substring(1);
                }
                return value.split("").reverse().join("");
            }
    }
});

/**
 * Creating the request for our scraping according to the parameters given by the user
 * @param city
 * @param foodType
 * @param starred
 * @returns {string}
 */
let createURLQuery = function (city, foodType, starred) {
    return 'https://restaurant.michelin.fr/restaurants/' + city + "/"
        + foodType + "/"
        + ((starred) ? "restaurants_michelin" : "");
};

/**
 * This method goes on the michelin website and scrapes all restaurants
 * Let's get the restaurants name, url on michelin, stars,
 * @param url
 */
let getRestaurantsXray = function (url) {
    getNumberPages(url, function (numPages) {
        var tabInfos = [];
        for (let i = 1; i <= numPages; i++) {
            let urlScrape = url + "/page-" + i;

            // First pass to get the results section
            x(urlScrape, '.poi-search-result', ['.ds-1col@html'])(function (err, content) {
                // Second pass on each element in order to get only relevant information
                console.log(urlScrape);
                try {
                    // TODO: Make less requests because the server seems to not be able to handle it
                    for (let restaurant of content) {
                        // Getting title, food type, price and michelin url
                        x(restaurant, {
                            title: '.poi_card-display-title | removeSpace',
                            foodType: '.poi_card-display-cuisines | removeSpace',
                            price: '.poi_card-display-price | removeSpace',
                            michelinUrl: '.poi-card-link@href'
                        })(function (err, attributes) {
                            tabInfos.push(attributes);
                        })
                    }
                }
                catch(error){
                    console.log(content)
                    console.log(err)
                }
            });
        }

    })
};

/**
 * Function used to get the number of pages on a michelin webpage
 * @param url
 * @param callback
 */
let getNumberPages = function (url, callback) {
    // We get the list of pages, and get the number before the last one
    x(url, '.item-list-first', ['.mr-pager-item'])(function (err, content) {
        callback(content[content.length - 2]);
    })
};

exports.getRestaurantsXray = getRestaurantsXray;
exports.createURLQuery = createURLQuery;