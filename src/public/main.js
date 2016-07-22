
function getRegistrationData(email) {
    $.get("/challenge?userID=" + email, function(data) {
        console.log(data);
        if (data.error) {
            alert(data.error);
        } else {
            $("#qrcode").empty();
            $("#qrcode").qrcode({
                text: "R " + data.challenge + " " + data.infoURL + " " + email,
                size: 174,
                radius: 0.3
            });

            $.get("/login?userID=" + email, function (res) {
                if (res.successful) {
                    $("#qrcode").empty();
                    $("#qrcode").append("<img src=\"check.png\" alt=\"Registration\n" +
                        "Successful!\" id=\"successImage\" style=\"width: 180px; height: 180px;\">");
                }
            }, "json");
        }
    }, "json");
}

function displayKeys(email, keys) {
    var keySelection = $("#keySelection");
    keySelection.empty();
    for (var keyHandle in keys) {
        keySelection.append("<div class=\"ui radio checkbox\" style=\"display: block;\">" +
            "<input name=\"key\" type=\"radio\" id=\"" + keyHandle + "\">" +
            "<label>" + keys[keyHandle] + "</label>" + "</div>");
    }

    $('.ui.modal').modal({
        onApprove: function(data) {
            console.log("Modal result:");
            for (var keyHandle in keys) {
                if ($("#" + keyHandle).is(":checked")) {
                    console.log("You selected the " + keys[keyHandle] + "!");
                    authenticateQR(email, keyHandle);
                    break;
                }
            }
        }
    }).modal('show');
}

function getKeys(email) {
    $.get("/keys?userID=" + email, function(data) {
        console.log("User keys:");
        console.log(data);
        displayKeys(email, data);
    }, "json");
}

function authenticateQR (email, keyHandle) {
    console.log("Getting challenge for " + email + " with key handle: " + keyHandle + ".");
    $.get("/challenge?userID=" + email + "&keyHandle=" + keyHandle, function(res) {
        if (res.error) {
            alert(res.error);
        } else {
            console.log(res);
            $("#qrcode").empty();
            $("#qrcode").qrcode({
                text: "A " + res.appID + " " + res.challenge + " " + res.keyID,
                size: 174,
                radius: 0.3
            });

            $.get("/login?userID=" + email, function (res) {
                if (res.successful) {
                    $("#qrcode").empty();
                    $("#qrcode").append("<img src=\"authenticated.png\" alt=\"Authentication\n" +
                        "Successful!\" id=\"successImage\" style=\"width: 180px; height: 180px;\">");

                }
            }, "json");
        }
    }, "json");
}

/**
 * Authenticate via Firebase Cloud Messaging.
 */
function authenticateNotify(email, keyHandle) {
    console.log("Getting challenge for " + email + " with key handle: " + keyHandle + ".");
    $.get("/challenge?userID=" + email + "&keyHandle=" + keyHandle, function(data) {
        if (data.error) {
            alert(data.error);
        } else {
            console.log(data);
            $.post("/notify?userID=" + email + "&keyHandle=" + keyHandle, data, function (res) {
                if (res.statusCode == 200) {
                    console.log("SENT FCM MESSAGE!")
                    $.get("/login?userID=" + email, function (loginStatus) {
                        if (loginStatus.successful) {
                            $("#qrcode").empty();
                            $("#qrcode").append("<img src=\"authenticated.png\" alt=\"Authentication\n" +
                                "Successful!\" id=\"successImage\" style=\"width: 180px; height: 180px;\">");
                            console.log("Authentication successful!");
                        } else {
                            console.log("Authentication failed!");
                        }
                    }, "json");
                } else {
                    console.log("FCM failed to process the notification: " + res.statusCode);
                }
            }, "json");
        }
    }, "json");
}

$(document).ready(function() {
    $("#button-register").on("click", function() {
        getRegistrationData($("#user-email").val());
    });
    $("#button-authenticate").on("click", function() {
        getKeys($("#user-email").val());
    });

    $("#modal-close").click(function(){
        $('.ui.modal').modal('hide');
    });

    $("#modal-approve").click(function(){
        $('.ui.modal').modal('hide');
    });
});
