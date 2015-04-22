"use strict";

var Comment = Backbone.Model.extend({
    defaults: {
        "text": "default comment text",
        "author": "default author",
        "datetime": new Date()
    },

    parse: function(response) {
        var result = {};
        result["text"] = response["text"];
        result["author"] = response["author_name"];
        result["datetime"] = new Date(response["timestamp"]);
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
        this.url = '/scav_board/api/comments/item/' + item_number;
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
        "comments": new CommentCollection(),
        "itemNumber": -1,
        "numNew": 2
    },
    
    parse: function(response) {
        var result = {};
        result["header"] = new ThreadHeader({title: response["title"], text: response["description"]});
        result["itemNumber"] = response["item_number"];
        result["numNew"] = -1; // TODO: Change this to reflect server side stuff once users get set up
        return result;
    }
});

var ThreadCollection = Backbone.Collection.extend({
    model: CommentThread,
    url: '/scav_board/api/items/'
});
