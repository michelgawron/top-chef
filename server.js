/**
 * Created by M2469215 on 16/02/2018.
 */

let express = require('express');
let michelin = require("./scripts/michelin.js");

michelin.getRestaurantsXray("https://restaurant.michelin.fr/restaurants/france");

let app = express();

/**
 * Basic test function
 */
app.use('/', function(req, res, next){
    console.log("A connection has been recorded");
});

app.listen(3000);