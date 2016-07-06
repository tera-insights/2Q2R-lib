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
    for (var userID in challenges) {
        if (challenges[userID].challenge == challenge) {
            return userID;
        }
    }
}

/**
 * This method produces challenges for registration and authentication tasks.
 */
exports.challenge = function (req, res) {

    var userID = req.query.userID;
    var keyID = req.query.keyHandle;

    console.log(userID);
    console.log(keyID);

    if (!userID) {
        res.send(JSON.stringify({
            error: "UserID required."
        }));
        return;
    }

    var u2fReq = u2f.request(info.appID, keyID);
    challenges[userID] = u2fReq;

    var reply = {
        infoURL: "http://" + findIPv4() + ":8081/info",
        challenge: u2fReq.challenge,
        appID: info.appID,
        keyID: keyID
    };

    res.send(JSON.stringify(reply));

}

exports.login = function (req, res) {

    var userID = req.query.userID;

    challenges[userID].onCompletion = res;

}

/**
 * Takes a userID through the URL and sends back a map of key handles
 * and their names registered for that user, or an error if there are
 * no keys registered for that account. The map will be a JSON.
 */
exports.keys = function (req, res) {
    
    var userID = req.query.userID;
    var reply = {};
    var userRegistration = registrations[userID];

    if (userRegistration) { // Does the account exist?
        for (var keyHandle in userRegistration) {
            reply[keyHandle] = userRegistration[keyHandle].deviceName;
        }
        res.send(JSON.stringify(reply))
    } else {
        res.send(JSON.stringify({
            error: "The user has not been registered yet."
        }));
    }

}

/**
 * Because QR codes can only store so much information before becoming
 * inefficiently complex, the registering user's ID isn't embedded in
 * each registration QR. Instead, the registering device can send the
 * relying party its challenge in return for the respective userID.
 * This allows device to make sure the user doesn't wastefully register
 * the same device multiple times on the same account.
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

    console.log(req.body);
    var userID = findUserID(req.body.clientData.challenge);
    var loginRes = challenges[userID].onCompletion;
    var checkRes = u2f.checkRegistration(challenges[userID], req.body);

    if (checkRes.successful) {

        loginRes.status(200).send({ successful: true });
        delete challenges[userID];

        var innerObject;
        if (!(innerObject = registrations[userID]))
            innerObject = {};

        innerObject[checkRes.keyHandle] = {
            pubKey: checkRes.publicKey,
            deviceName: req.body.deviceName,
            counter: 0
        };
        registrations[userID] = innerObject; // overwrites--should instad check for existing userID

        console.log("New Registration: ", userID);
        console.log("On Device: ", req.body.deviceName);
        console.log("Accounts:");
        console.log(registrations);

        res.status(200).send("Registration approved!"); // OK

    } else {

        loginRes.status(400).send();

        console.log("Registration for \"" + userID + "\" failed.");
        res.status(400).send("Registration failed."); // BAD REQUEST

    }

}


exports.auth = function (req, res) {

    var userID = findUserID(req.body.clientData.challenge);
    var u2fRes = {
        clientData: JSON.stringify(req.body.clientData),
        signatureData: req.body.signatureData
    };
    var pubKey = registrations[userID][challenges[userID].keyHandle].pubKey;
    var checkSig = u2f.checkSignature(challenges[userID], u2fRes, pubKey);

    if (checkSig.successful) {

        challenges[userID].onCompletion.status(200).send({ successful: true });

        // open user session
        res.status(200).send("Authentication approved!");

    } else {

        challenges[userID].onCompletion.status(400).send();

        console.log("Authentication for \"" + userID + "\" failed.");
        res.status(400).send("Authentication failed.");

    }

} /*

{
    appInfo: {
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        appID: infoURL
        
    },
    keyInfo: {
        keyID: {
            appID: ,
            counter: ,
            userID: 
        }
        keyID: {
            appID: ,
            counter: ,
            userID: 
        }
        keyID: {
            appID: ,
            counter: ,
            userID: 
        }
    }
}

*/