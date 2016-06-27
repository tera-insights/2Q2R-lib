'use strict';

var crypto = require('crypto');
var u2f    = require('u2f');

var info = {
    appID: crypto.randomBytes(32).toString('base64'),
    appName: "2Q2R Demo",
    baseURL: "http://" + findIPv4() + ":8081/"
};

/** Pending challenges. One for each user. */
var challenges = {};

/** Registered accounts. */
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
        if (challenges[key].challenge == challenge) {
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
    var u2fReq = u2f.request(info.appID);

    // remember the challenge
    challenges[userID] = u2fReq;

    console.log("UserID: ", userID);
    console.log("Server Address: ", findIPv4());

    var reply = {
        challenge: u2fReq.challenge,
        infoURL: "http://" + findIPv4() + ":8081/info"
    };

    res.send(JSON.stringify(reply));
}

/**
 * Because QR codes can only store so much information before becoming
 * inefficiently complex, the registering user's ID isn't embedded in
 * each registration QR. Instead, the registering device can send the
 * relying party its challenge in return for the respective userID.
 */
exports.userID = function (req, res) {
    res.send(findUserID(req.body.challenge));
}


/**
 * This is the U2F registration function, which receives a registration
 * response from a U2F device and responds with a status code based on
 * whether or not the registration was accepted.
 */
exports.register = function (req, res) {

    var userID = findUserID(JSON.parse(req.body.clientData).challenge);
    var registerData = {
        registrationData: req.body.registrationData,
        clientData: req.body.clientData
    }
    var checkRes = u2f.checkRegistration(challenges[userID], req.body);

    console.log("\nRegistration:");
    console.log(userID);
    console.log(challenges);
    console.log(checkRes);

    if (checkRes.successful) {

        delete challenges[userID];
        registrations[userID] = {
            pubKey: checkRes.publicKey,
            certificate: checkRes.certificate
        };
        console.log("New Registration: ", userID);
        res.status(200).send("Registration approved!"); // OK

    } else {

        console.log("Registration for \"" + userID + "\" failed.");
        res.status(400).send("Registration failed."); // BAD REQUEST

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