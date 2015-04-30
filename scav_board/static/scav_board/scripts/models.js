"use strict";
var app = app || {};

var Comment = Backbone.Model.extend({
    defaults: {
        "text": "default comment text",
        "username": "default",
        "author_display_name": "Anonoymous Scavvie",
        "datetime": new Date()
    },

    parse: function(response) {
        var result = {};
        result["text"] = response["text"];
        result["author_display_name"] = response["author_name"];
        result["username"] = response["author_username"];
        result["datetime"] = new Date(response["timestamp"]);
        result['id'] = response['id'];
        return result;
    }
});

var ThreadHeader = Backbone.Model.extend({
    defaults: {
        "title": "Placeholder title",
        "text": "Placeholder text"
    }
});

var CommentCollection = Backbone.Collection.extend({
    model: Comment,

    initialize: function(models, item_number) {
        this.url = '/scav_board/api/items/' + item_number + '/comments/';
    },

    getLastTwo: function() {
        return this.models.slice(-2);
    },

    comparator: function(comment) {
        return comment.get('datetime');
    }

});

var CommentThread = Backbone.Model.extend({
    defaults: {
        "header": new ThreadHeader(),
        "itemNumber": -1,
    },
    
    parse: function(response) {
        var result = {};
        result["header"] = new ThreadHeader({title: response["title"], text: response["description"]});
        result["itemNumber"] = response["item_number"];
        return result;
    },

    // This function goes and actually creates the contents of the comment thread, then starts polling
    // for changes on the database.
    initializeComments: function() {
        this.set("comments", new CommentCollection([], this.get("itemNumber")));
        this.get('comments').fetch();
        this.attributes['serverPolling'] = setTimeout(_.bind(function() {
            this.get('comments').fetch({delete: false});
        }, this), 5000);
    },

    teardownComments: function() {
        clearTimeout(this.attributes['serverPolling']);
        this.attributes['comments'] = null;
    }


});

var ThreadCollection = Backbone.Collection.extend({
    model: CommentThread,
    initialize: function(pageNum) {
        this.url = '/scav_board/api/page/' + pageNum + '/items/';
    },
    comparator: function(thread) {
        return thread.get('itemNumber');
    }
});

var UserModel = Backbone.Model.extend({
    defaults: {
        'username': 'anonymous',
        'first_name': 'Anonymous',
        'last_name': 'Scavvie',
        'loggedin': false
    }
});

$(document).ready(function() {
    app.userM = new UserModel();
    app.lbv = new LoginButtonView(app.userM);

    $('#login-form').submit(function(event) {
        event.preventDefault();
        var csrftoken = $.cookie('csrftoken');

        var options = {
            data: {
                'username': $(event.target).find('#loginUsername').val(),
                'password': $(event.target).find('#loginPassword').val()
            },

            method: 'POST',

            headers: {
                'X-CSRFToken': csrftoken
            },

            success: function(username_data) {
                alert("Login successful");
                $("#login-modal").modal("hide");
                app.userM.set({
                    'username': username_data['username'],
                    'first_name': username_data['first_name'],
                    'last_name': username_data['last_name'],
                    'loggedin': true
                });
            },

            error: function() {
                alert("Login failed");
            }
        };
        $.ajax('/scav_board/login/', options)
    });

    $("#logout-button").click(function(event) {
        event.preventDefault();
        var csrftoken = $.cookie('csrftoken');
        var options = {
            data: {
                'username': app.userM.get('username')
            },
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            success: function() {
                alert('Logout successful');
                $("#logout-model").modal('hide');
                app.userM.set({'loggedin': false});
            },
            error: function() {
                alert('Logout failed');
            }
        };
        $.ajax('/scav_board/logout/', options)
    });

    app.allThreads = new ThreadCollection(1);
    app.pv0 = new PageView(app.allThreads);
    $(document.body).append(app.pv0.$el);
    app.allThreads.fetch();
});