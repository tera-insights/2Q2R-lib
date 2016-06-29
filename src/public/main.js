
function getRegistrationData(email) {
    $.get("/challenge?userID=" + email, function(data) {
        console.log(data);
        if (data.error) {
            alert(data.error);
        } else {
            $("#qrcode").empty();
            $("#qrcode").qrcode({
                text: "R " + data.challenge + " " + data.infoURL,
                size: $("#qrcode").width(),
                radius: 0.3
            });
        }
    }, "json");
}

function displayKeys(keys) {
    $('.ui.modal').modal({
        onApprove: function(data) {
            alert(data.toString());
        }
    }).modal('show');
}

function getKeys(email) {
    $.get("/keys/" + email, function(data) {
        if (data.error) {
            alert(error);
        } else {
            displayKeys(data);
        }
    }, "json");
}

function getAuthenticationData (email, keyHandle) {
    $.get("/challenge?userID=" + email + "&keyHandle=" + keyHandle, function(res) {
        console.log(res);
        if (res.error) {
            alert(res.error);
        } else {
            $("#qrcode").empty();
            $("#qrcode").qrcode({
                text: "A " + res.appID + " " + res.challenge + " " + res.keyID,
                size: $("#qrcode").width,
                radius: 0.3
            });
        }
    }, "json");
}

$(document).ready(function() {
    $("#button-register").on("click", function() {
        getRegistrationData($("#user-email").val());
    });
    $("#button-authenticate").on("click", function() {
        displayKeys();
    });

    $("#modal-close").click(function(){
        $('.ui.modal').modal('hide');
    });

    $("#modal-approve").click(function(){
        $('.ui.modal').modal('hide');
    });
});
