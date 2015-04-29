"use strict";

var PageView = Backbone.View.extend({
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
        this.nologin_notification = this.$('.nologin-notification');
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
        if(app.userM.get('loggedin')) {
            var commentText = this.$("textarea").val();
            var newCommentObj = new Comment({"text": commentText, 'username': app.userM.get('username')});
            this.commentThread.get("comments").add(newCommentObj);
            var csrftoken = $.cookie('csrftoken');
            newCommentObj.save({}, {headers: {'X-CSRFToken': csrftoken}});
            this.$("textarea").val("");
        }
        else {
            this.nologin_notification.show('fast');
        }
    },

    render: function() {
        var headerModel = this.commentThread.attributes.header.attributes;
        this.headerTitle.html(headerModel.title);
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

var LoginButtonView = Backbone.View.extend({
    loggedin_template: _.template($("#loggedin-template").html()),
    loggedout_template: _.template($("#loggedout-template").html()),
    el: "#login-button",

    initialize: function(user_model) {
        this.user_model = user_model;
        this.listenTo(this.user_model, 'change', this.setLogin);
        this.setLogin();
    },

    setLogin: function() {
        if(this.user_model.get('loggedin')) {
            this.$el.off();
            this.$el.click(function() {
                $("#logout-modal").modal("show");
            });
        }
        else {
            this.$el.off();
            this.$el.click(function() {
                $("#login-modal").modal("show");
            });
        }
        this.render();
    },

    render: function() {
        if(this.user_model.get('loggedin')) {
            var displayName = this.user_model.get('first_name') + ' ' + this.user_model.get('last_name');
            this.$el.html(this.loggedin_template({'displayName': displayName}));
        }
        else {
            this.$el.html(this.loggedout_template());
        }
        return this;
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
            'author': this.model.get("author_display_name")
        }));
        return this
    }
});

