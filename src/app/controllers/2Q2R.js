'use strict';

var crypto = require('crypto');
var u2f    = require('u2f');

var info = {
    appID: crypto.randomBytes(32).toString('base64'),
    appName: "2Q2R Demo",
    baseURL: "http://" + findIPv4() + ":8081/"
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
 * Returns the IP address of the server.
 */
function findIPv4() {

    var os = require('os');
    var ni = os.networkInterfaces();

    for (var int in ni) {
        if (int.startsWith("lo"))
            continue;

        var networks = ni[int];

        for (var i = 0; i < networks.length; i++) {
            var network = networks[i];

            if(!network.address.startsWith("127") && network.family == "IPv4") {
                return network.address;
            }
        }
    }

    console.log("No network found.");
    return "No network found.";

}

function findUserID(challenge) {
    for (var key in challenges) {
        if (challenges.hasOwnProperty(key) && challenges[key].challenge == challenge) {
            return key;
        }
    }
}

/**
 * This method produces a challenge that later is used to complete the login
 */
exports.challenge = function (req, res) {
    var userID = req.params.userID;

    // generate random challenge
    var req = u2f.request(info.appID);

    // remember the challenge
    challenges[userID] = req;

    console.log("UserID: ", userID);
    console.log("Server Address: ", findIPv4());

    var reply = {
        challenge: req.challenge,
        infoURL: "http://" + findIPv4() + ":8081/info"
    };

    res.send(JSON.stringify(reply));
}


/**
 * This is the U2F registration function, which receives a registration
 * response from a U2F device and responds with a status code based on
 * whether or not the registration was accepted.
 */
exports.register = function (req, res) {

    res.status(100).send();
    // console.log(req.body);
    // var userID = findUserID(req.body.challenge);
    // var u2fResponse = {
    //     clientData: {
    //         challenge: req.body.challenge
    //     },
    //     registrationData: req.body.registrationData
    // };
    // var checkRes = u2f.checkRegistration(challenges[userID], u2fResponse);

    // if (checkRes.successful) {

    //     delete challenges[userID];
    //     registrations[userID] = {
    //         pubKey: checkRes.publicKey,
    //         certificate: checkRes.certificate
    //     };
    //     console.log("New Registration: ", registrations[userID]);
    //     res.status(200).end(); // OK

    // } else {

    //     console.log("Registration for " + userID + " failed.");
    //     res.status(400).end(); // BAD REQUEST

    // }

}


exports.auth = function (req, res) {
    console.log(req.body);
    var userID = req.body.userID;

    if (!checkChallenge(userID, req.body.challenge))
        res.status(401).send({ error: "Challenge invalid for " + userID });
    else {
        // find the registration
        var reg = registrations[userID];
        if (!reg || !reg.pubKey) {
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