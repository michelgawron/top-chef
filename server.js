/**
 * Created by M2469215 on 16/02/2018.
 */

let express = require('express');
let michelin = require("./scripts/michelin.js");

let app = express();

/**
 * Basic test function
 */
app.use('/', async function (req, res, next) {
    console.log("A connection has been recorded");
    let myurl = "https://restaurant.michelin.fr/restaurants/france";
    michelin.getRestaurants(myurl)
        .then(x => {
            console.log(x[3500])
        });
});

app.listen(3000);