'use strict';
var express = require("express");
var app = express();

var _2Q2R = require("./app/controllers/2Q2R");

var config = {
    port: 8081
}

app.get("/info", _2Q2R.info);
app.get("/challenge/:userID", _2Q2R.challenge);
app.post("/auth", _2Q2R.auth);
app.post("/register", _2Q2R.register);

app.use(express.static("public/"))

// Start the app by listening on <port>
app.listen(config.port);

// Logging initialization
console.log('2Q2R server started on  ' + config.port);