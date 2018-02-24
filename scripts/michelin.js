/**
 * Created by M2469215 on 16/02/2018.
 * This module is mainly used to get restaurants from hte michelin website
 */
var exports = module.exports = {};
let phantom = require('phantom');
let Xray = require('x-ray');
let x = Xray({
    filters: {
        removeSpace: /**
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
}).timeout(0);

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
        var tabUrls = [];

        // First pass to get the results section
        x(url, '.poi-search-result', ['.ds-1col@html'])(function (err, content) {
            // Second pass on each element in order to get only relevant information
            console.log(url);
            try {
                for (let restaurant of content) {
                    // Getting title, food type, price and michelin url
                    x(restaurant, {
                        title: '.poi_card-display-title | removeSpace',
                        foodType: '.poi_card-display-cuisines | removeSpace',
                        price: '.poi_card-display-price | removeSpace',
                        michelinUrl: '.poi-card-link@href'
                    })(function (err, attributes) {
                        tabInfos.push(attributes);
                    });
                }
                console.log(tabInfos.length);
            }
            catch (error) {
                console.log(content);
                console.log(err);
            }
        }).paginate('.mr-pager-item.last a@href').limit(10).then(
            function(res){
                console.log(res.length)
            }
        );
        console.log(tabInfos.length);
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