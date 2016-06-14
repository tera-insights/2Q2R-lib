'use strict';

var crypto = require('crypto');

var info = {
    appID: "dalfkj"
};

/** Pending challenges. One for each user */
var challenges = {};

/** Registered accounts */
var registrations = {}

/**
 * The info send to the phone apps to inform them on server properties
 */
exports.info = function (req, res) {

    res.send(JSON.stringify(info));

}

/**
 * Auxiliary function to check that the challenge is correct
 */
function checkChallenge(userID, challenge) {
    var ch = challenges[userID];

    if (!ch || ch != challenge) {
        console.log("Challenge for " + userID + " failed. " + challenge);
        return false;
    } else {
        return true;
    }
}

/**
 * This method produces a challenge that later is used to complete the login
 */
exports.challenge = function (req, res) {
    var userID = req.params.userID;

    // generate random challenge
    var challenge = crypto.randomBytes(32).toString('base64');

    // remember the challenge
    challenges[userID] = challenge;

    console.log("UserID: ", userID);
    var reply = {
        challenge: challenge,
        email: userID,
        info: info
    }

    res.send(JSON.stringify(reply));
}


/**
 * This is the main registration function
 */
exports.register = function (req, res) {
    console.log(req.body);
    var userID = req.body.userID;
    if (!checkChallenge(userID, req.body.challenge))
        res.status(401).send({ error: "Challenge invalid for " + userID });
    else {
        var registration = {
            userID: userID,
            pubKey: req.body.pubKey,
            pubKeyType: req.body.pubKeyType
        }

        registrations[userID] = registration;

        var rep = {
            appID: info.appID
        }
        res.send(JSON.stringify(rep));
    }
}


exports.auth = function (req, res) {
    console.log(req.body);
    var userID = req.body.userID;

    if (!checkChallenge(userID, req.body.challenge))
        res.status(401).send({ error: "Challenge invalid for " + userID });
    else {
        // find the registration
        var reg = registrations[userID];
        if (!reg || reg.userID != userID || !reg.pubKey) {
            res.status(400).send({ error: "Bad authentication request" });
        } else {
            // TODO: check the digital signature of the auth request 
            var rep = {
                appID: info.appID
            }
            res.send(JSON.stringify(rep));
        }
    }
} 