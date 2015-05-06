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
        "text": "Placeholder text",
        "expiration": null,
        "roadtrip": false,
        "showcase": false,
        "page": -1,
        "done": false,
        "claimedBy": null,
        "itemNumber": -1,
        "points": -1
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
        "itemNumber": -1
    },
    
    parse: function(response) {
        var result = {};
        result["header"] = new ThreadHeader({
            title: response["title"],
            text: response["description"],
            expiration: response["expiration"] ? new Date(response["expiration"]) : null,
            roadtrip: response["categories"].indexOf('road-trip') > -1,
            showcase: response["categories"].indexOf('showcase') > -1,
            page: response["page"],
            claimedBy: response["claimedBy"],
            done: response["done"],
            points: response["points"],
            itemNumber: response["item_number"],
            categories: response["categories"]
        });

        result["itemNumber"] = response["item_number"];
        result['id'] = response['id'];
        return result;
    },

    // This function goes and actually creates the contents of the comment thread, then starts polling
    // for changes on the database.
    initializeComments: function(success_callback) {
        this.set("comments", new CommentCollection([], this.get("itemNumber")));
        this.get('comments').fetch({success: success_callback});
        this.attributes['serverPolling'] = setInterval(_.bind(function() {
            this.get('comments').fetch({delete: false});
        }, this), 10000);
        this.listenTo(this.get("header"), "change", _.bind(function() {
            this.trigger("change");
        }, this));
    },

    teardownComments: function() {
        clearTimeout(this.attributes['serverPolling']);
        this.attributes['comments'] = null;
    }
});

var ThreadCollection = Backbone.Collection.extend({
    model: CommentThread,
    initialize: function(qstring) {
        this.url = '/scav_board/api/items/?' + qstring;
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
    },
    url: '/scav_board/api/user_info/'
});

