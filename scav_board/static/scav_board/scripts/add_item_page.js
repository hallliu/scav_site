var submit_function = function(fields) {
    $("#submit-status").html("Submitting...");
    var val_dict = {};
    for (var key in fields) {
        if (fields.hasOwnProperty(key))
            val_dict[key] = fields[key].val();
    }
    var options = {
        data: val_dict,
        method: "POST",
        headers: {
            'X-CSRFToken': $.cookie("csrftoken")
        },
        success: function(data) {
            var num = data["item_number"];
            $("#submit-status").html("Item " + num + " has been successfully submitted.");
            clear_fields(fields);
        },
        error: function(xhr) {
            $("#submit-status").html(xhr.responseText);
        }
    };
    $.ajax("/scav_board/add_item/", options);
};

var clear_fields = function(fields) {
    for (var key in fields) {
        if (fields.hasOwnProperty(key))
            fields[key].val('');
    }
    fields["item-expires"].prop("checked", false);
};

var wrapper = {};

$(document).ready(function() {
    var all_fields = {};
    ["item-page", "item-number", "item-description", "item-expires", "exp-day", "exp-hour", "exp-min"].forEach(function(fname) {
        all_fields[fname] = $("#" + fname);
    });
    wrapper.submit_fn = function() {
        submit_function(all_fields);
    };
});