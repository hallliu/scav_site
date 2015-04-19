"use strict";

var app = app || {}

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
    }
});

var CommentThread = Backbone.Model.extend({
    defaults: {
        "header": new ThreadHeader(),
        "comments": new CommentCollection(),
        "itemNumber": -1,
        "numNew": 2
    }
});

var ThreadCollection = Backbone.Collection.extend({
    model: CommentThread,
});

var pageView = Backbone.View.extend({
    tagname: "ul",
    classname: "list-group",

    initialize: function(threads) {
        this.threads = threads;
        this.listenTo(this.threads, "add", this.addThread);
    },

    addThread: function(threadModel) {
        var newThreadButtonView = new CommentButtonView(threadModel);
        this.$el.append(newThreadButtonView.render().$el);
    }
});

var CommentButtonView = Backbone.View.extend({
    tagName: "li",
    className: "list-group-item",

    template: _.template($("#commentbutton-template").html()),
    events: {
        "click .btn": "showThread"
    },

    initialize: function(commentThread) {
        this.commentThread = commentThread;
        this.listenTo(this.commentThread, 'change', this.render);
    },
    
    render: function() {
        this.$el.html(this.template({
            "threadNum": this.commentThread.get("itemNumber"),
            "numNew": this.commentThread.get("numNew")
        }));
        return this;
    },

    showThread: function() {
        var ntView = new CommentThreadView(this.commentThread);
        ntView.render().$el.modal("toggle");
    }
});

var CommentThreadView = Backbone.View.extend({
    tagName: "div",
    className: "modal fade",
    
    baseHtml: $("#commentThread-template").html(),
    showmore_template: _.template($("#showmore-template").html()),

    events: {
        "click .submit-comment": "submitComment",
        "click .show-more-button": "toggleShowAllComments",
        "toggleShowElements": "toggleShowAllComments"
    },

    initialize: function(commentThread) {
        this.commentThread = commentThread;
        this.$el.html(this.baseHtml);
        this.$el.on("hidden.bs.modal", this.close());
        this.$("textarea").one("click", function() {
            $(this).val("");
        });

        this.$(".show-more").hide();

        this.headerTitle = this.$el.find('.item-title');
        this.itemText = this.$el.find('.item-text');
        this.comments = this.$('.list-group');

        this.listenTo(this.commentThread.get("comments"), 'add', this.addComment);
        this.listenTo(this.commentThread.get("header"), 'change', this.render);
    },

    addComment: function(comment) {
        var newCommentView = new commentView({model: comment});
        var commentLength = this.commentThread.attributes.comments.length; 
        this.comments.append(newCommentView.render().$el);

        if (commentLength > 3 && !this.commentsShown) {
            this.comments.children('li').slice(0, -3).each(function() {$(this).slideUp();});
            this.$(".show-more").html(this.showmore_template({show: this.commentsShown, numAffected: commentLength - 3}));
            this.$(".show-more").show();
        }
    },

    toggleShowAllComments: function() {
        var commentLength = this.commentThread.attributes.comments.length; 
        if (this.commentsShown) {
            this.comments.children('li').slice(0, -3).each(function() {$(this).slideUp();});
        } else {
            this.comments.children('li').slice(0, -3).each(function() {$(this).slideDown();});
        }
        this.commentsShown = !this.commentsShown;
        this.$(".show-more").html(this.showmore_template({show: this.commentsShown, numAffected: commentLength - 3}));
    },

    submitComment: function(e) {
        e.preventDefault();
        var commentText = this.$("textarea").val();
        var newCommentObj = new Comment({"text": commentText});
        this.commentThread.get("comments").add(newCommentObj);
        this.$("textarea").val("");
    },

    render: function() {
        var headerModel = this.commentThread.attributes.header.attributes;
        this.headerTitle.html(headerModel.title)
        this.itemText.html(headerModel.text);
        return this;
    },

    close: function() {
        this.$el.off();
        this.remove();
    }
});


var commentView = Backbone.View.extend({
    template: _.template($("#comment-template").html()),

    tagName: 'li',
    attributes: {
        'class': 'list-group-item'
    },
    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
        var datestring = this.model.get("datetime").toLocaleString();
        this.$el.html(this.template({
            'text': this.model.get("text"),
            'datestring': datestring,
            'author': this.model.get("author")
        }));
        return this
    }
});

