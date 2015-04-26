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
        "itemNumber": -1,
        "numNew": 2
    },
    
    parse: function(response) {
        var result = {};
        result["header"] = new ThreadHeader({title: response["title"], text: response["description"]});
        result["itemNumber"] = response["item_number"];
        result["numNew"] = -1; // TODO: Change this to reflect server side stuff once users get set up
        return result;
    },

    // This function goes and actually creates the contents of the comment thread, then starts polling
    // for changes on the database.
    initializeComments: function() {
        var cc = new CommentCollection([], this.get('itemNumber'));
        cc.fetch();
        this.attributes["comments"] = cc;
        this.attributes['serverPolling'] = setTimeout(function() {
            cc.fetch();
        }, 1000);
    },

    teardownComments: function() {
        clearTimeout(this.attributes['serverPolling']);
        this.attributes['comments'] = null;
    }


});

var ThreadCollection = Backbone.Collection.extend({
    model: CommentThread,
    initialize: function(pageNum) {
        this.url = '/scav_board/api/page/' + pageNum;
    }
});
