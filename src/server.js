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

app.get("/v1/info/:appID", _2Q2R.info);
app.get("/v1/login", _2Q2R.login);
app.get("/v1/challenge", _2Q2R.challenge);
app.get("/v1/forget", _2Q2R.forget);
app.get("/v1/keys", _2Q2R.keys);
app.post("/v1/notify", _2Q2R.notify);
app.post("/v1/register", _2Q2R.register);
app.post("/v1/auth", _2Q2R.auth);

app.use(express.static("public/"));

// Logging initialization
console.log('2Q2R server started on  ' + config.port);