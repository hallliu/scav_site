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
            "description": this.commentThread.get("header").get("text")
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

        this.headerView = new ItemDescriptionView(commentThread.get("header"));
        this.$(".item-text").append(this.headerView.$el);

        this.comments = this.$('.list-group');
        this.nologin_notification = this.$('.nologin-notification');

        this.commentThread.initializeComments(_.bind(function() {
            this.initialCommentLoad();
            this.listenTo(this.commentThread.get("comments"), 'add', this.addComment);
        }, this));
    },

    initialCommentLoad: function() {
        var commentCollection = this.commentThread.get("comments");
        var num_comments = commentCollection.length;
        commentCollection.forEach(_.bind(function(comment_elem, idx) {
            var newCommentView = new commentView({model: comment_elem});
            newCommentView.listenTo(this, "close_thread", newCommentView.remove);
            var newCommentElem = newCommentView.render().$el;
            if (idx < num_comments - 3) {
                newCommentElem.css('display', 'none');
            }
            this.comments.append(newCommentElem);
        }, this));
        if (num_comments > 3) {
            this.$(".show-more").html(this.showmore_template({show: this.commentsShown, numAffected: num_comments - 3}));
            this.$(".show-more").show();
        }
    },

    addComment: function(comment) {
        var newCommentView = new commentView({model: comment});
        newCommentView.listenTo(this, "close_thread", newCommentView.remove);
        this.comments.append(newCommentView.render().$el);
        this.checkCommentFolding();
    },

    checkCommentFolding: function() {
        var commentLength = this.commentThread.attributes.comments.length;
        if (commentLength > 3 && !this.commentsShown) {
            this.comments.children('li').slice(0, -3).each(function () {
                $(this).slideUp();
            });
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
        if(app.userM.get('loggedin') || this.alreadyReminded) {
            var commentText = this.$("textarea").val();
            if (commentText.length == 0) {
                return;
            }
            var newCommentObj = new Comment({"text": commentText, 'username': app.userM.get('username')});
            this.commentThread.get("comments").add(newCommentObj);
            var csrftoken = $.cookie('csrftoken');
            newCommentObj.save({}, {headers: {'X-CSRFToken': csrftoken}});
            this.$("textarea").val("");
        }
        else {
            this.nologin_notification.show('fast');
            this.alreadyReminded = true;
        }
    },

    render: function() {
        this.$(".item-title").html(this.commentThread.get("header").get("title"));
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

var ItemDescriptionView = Backbone.View.extend({
    template: _.template($("#item-description-template").html()),
    tagName: "div",
    className: "panel-body",

    initialize: function(thread_header) {
        this.thread_header = thread_header;
        this.listenTo(this.thread_header, 'change', this.render);
        this.render();
    },

    render: function() {
        var template_options = {
            item_description: this.thread_header.get("text"),
            claimedBy: this.thread_header.get("claimedBy"),
            expires: (this.thread_header.get("expiration") === null) ? null : this.thread_header.get("expiration").toLocaleString()
        };
        this.$el.html(this.template(template_options));
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

var PageInfoView = Backbone.View.extend({
    el: "#page-info-elem",
    template: _.template($("#page-info-template").html()),
    render: function(pageNum) {
        this.$el.html(this.template({pageNum: pageNum}));
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

