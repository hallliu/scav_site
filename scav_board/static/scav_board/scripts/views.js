"use strict";

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
        this.$el.on("hide.bs.modal", _.bind(this.close, this));

        this.$(".show-more").hide();

        this.headerTitle = this.$el.find('.item-title');
        this.itemText = this.$el.find('.item-text');
        this.comments = this.$('.list-group');
        this.commentThread.initializeComments();

        this.listenTo(this.commentThread.get("comments"), 'add', this.addComment);
        this.listenTo(this.commentThread.get("header"), 'change', this.render);
    },

    addComment: function(comment) {
        var newCommentView = new commentView({model: comment});
        newCommentView.listenTo(this, "close_thread", newCommentView.remove);
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
    },

    remove: function() {
        this.trigger('close_thread');
        this.commentThread.teardownComments();
        Backbone.View.prototype.remove.apply(this);
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

