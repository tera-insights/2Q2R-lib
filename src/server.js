'use strict';
var express = require("express");
var parser = require("body-parser");
var morgan = require("morgan");
var app = express();

var _2Q2R = require("./app/controllers/2Q2R");

var config = {
    port: 8081
}

// Start the app by listening on <port>
app.listen(config.port);
app.use(morgan('dev'));
app.use(parser.json());
app.use(parser.urlencoded({ extended: false }));

app.get("/info", _2Q2R.info);
app.get("/login", _2Q2R.login);
app.get("/challenge", _2Q2R.challenge);
app.get("/keys", _2Q2R.keys);
app.post("/notify", _2Q2R.notify);
app.post("/register", _2Q2R.register);
app.post("/auth", _2Q2R.auth);

app.use(express.static("public/"));

// Logging initialization
console.log('2Q2R server started on  ' + config.port);