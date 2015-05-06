var submit_fn = function() {
    $("#submit-status").html("Submitting...");

    var options = {
        data: $("#item-form").serialize(),
        method: "POST",
        headers: {
            'X-CSRFToken': $.cookie("csrftoken")
        },
        success: function(data) {
            var num = data["item_number"];
            $("#submit-status").html("Item " + num + " has been successfully submitted.");
            $("#item-form")[0].reset();
        },
        error: function(xhr) {
            $("#submit-status").html(xhr.responseText);
        }
    };
    $.ajax("/scav_board/add_item/", options);
};
