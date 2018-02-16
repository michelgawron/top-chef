/**
 * Created by M2469215 on 16/02/2018.
 * This module is mainly used to get restaurants from hte michelin website
 */
var exports = module.exports = {};
var phantom = require('phantom');
var Xray = require('x-ray');
var x = Xray();


var getRestaurantsXray = function (url) {
    x(url, '.poi-search-result@html')(function (err, content) {
        x(content, ['.ds-1col@attr-gtm-title'])(function(err, contentbis){
            console.log(contentbis);
        })
    });
};

var getRestaurantsPhantom = function (url) {
    // Creating phantom variables to store our instances and pages
    var sitepage = null;
    var phInstance = null;

    console.log("Got into function");

    phantom.create()
    // Creating phantom instance and page
        .then(instance => {
            phInstance = instance;
            return instance.createPage();
        })
        // Loading an url in our instance
        .then(page => {
            sitepage = page;
            console.log(url);
            return sitepage.open(url);
        })
        // Awaiting for the page to load and getting status
        .then(status => {
            console.log("Status: " + status);
            return sitepage.property('content');
        })
        // Getting page's content
        .then(content => {
            console.log("Content: " + content);
        })
        // Catching errors
        .catch(error => {
            console.log(error);
            phInstance.exit();
        });
};

exports.getRestaurants = getRestaurantsPhantom;
exports.getRestaurantsXray = getRestaurantsXray;