/**
 * Created by M2469215 on 16/02/2018.
 */

var express = require('express');
var michelin = require("./scripts/michelin.js");

michelin.getRestaurantsXray("https://restaurant.michelin.fr/restaurants/france");

var app = express();

app.use('/', function(req, res, next){
    console.log("A connection has been recorded");
});

app.listen(3000);