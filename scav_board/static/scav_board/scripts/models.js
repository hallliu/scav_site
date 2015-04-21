"use strict";

var Comment = Backbone.Model.extend({
    defaults: {
        "text": "default comment text",
        "author": "default author",
        "datetime": new Date()
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

    getLastTwo: function() {
        return this.models.slice(-2);
    },

    comparator: function(comment) {
        return comment.get('datetime');
    },

    url: '/scav_board/api/comments/'
});

var CommentThread = Backbone.Model.extend({
    defaults: {
        "header": new ThreadHeader(),
        "comments": new CommentCollection(),
        "itemNumber": -1,
        "numNew": 2
    },
    
    parse: function(response) {


    }
});

var ThreadCollection = Backbone.Collection.extend({
    model: CommentThread,
    url: '/scav_board/api/items/'
});
