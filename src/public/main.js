vex.defaultOptions.className = 'vex-theme-os';

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
    var form = $("#key-list");

    for (var keyHandle in keys) {
        input += "<input name=\"key\" type=\"radio\">" + keys[keyHandle] + "</input>";
    }

    $('.ui.modal').modal({
        onApprove: function() {
            alert(data.toString());
        }
    }).modal('show');

    /*vex.dialog.open({
        message: "Please select a key to authenticate with:",
        input: "<input name=\"key\" type=\"radio\">iPhone</input>",
        callback: function(data) {
            alert(data.toString());
        }
    });*/
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

$(document).ready(function() {
    $("#button-register").on("click", function() {
        getRegistrationData($("#user-email").val());
    });
    $("#button-authenticate").on("click", function() {
        getKeys($("#user-email").val());
    });

    // Modal Buttons
    $("#modal-close").click(function(){
        $('.ui.modal').modal('hide');
    });

    $("#modal-approve").click(function(){
        $('.ui.modal').modal('hide');
    });

    // Tabs
    $('.menu .item').tab();
});
