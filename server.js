/**
 * Created by M2469215 on 16/02/2018.
 */

process.env.UV_THREADPOOL_SIZE = 128;

let express = require('express');
let michelin = require("./scripts/michelin.js");
let lafourchette = require("./scripts/lafourchette.js");
let cheerio = require("cheerio");
let request = require('request');
let https = require('https');
let pool = new https.Agent({keepAlive: true, maxSockets: 1024});

let app = express();

let myurl = "https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin";

let restaurants = michelin.getRestaurants(myurl)
    .then(x => {
        console.log(x.length);
        console.log(x.slice(100, 111));
        lafourchette.processRestaurants(x)
            .then(y => {
                console.log(y.slice(100, 111));
            });
    });

app.listen(3000);