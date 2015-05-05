var make_search_query = function(search_string) {
    var page = null;
    var keywords = [];
    var categories = [];
    var tokens = search_string.split(" ");
    tokens.forEach(function(token) {
        if (token.charAt(0) === '#') {
            var sepk = token.split(":");
            if (sepk[0] === "#page") {
                page = sepk[1];
            } else if (sepk[0] === "#category") {
                categories.push(sepk[1]);
            }
        } else {
            keywords.push(token);
        }
    });
    var queries = [];
    if (page !== null) {
        queries.push("page=" + page);
    }
    keywords.forEach(function(kwd) {
        queries.push("keyword=" + kwd);
    });
    categories.forEach(function(cat) {
        queries.push("category=" + cat);
    });
    return queries.join('&');
};

$(document).ready(function() {
    app.userM = new UserModel();
    app.lbv = new LoginButtonView(app.userM);
    app.userM.fetch();

    window.onpopstate = function(event) {
        event.preventDefault();
        $(".modal").modal("hide");
    };
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
                $("#logout-modal").modal('hide');
                app.userM.set({'loggedin': false});
            },
            error: function() {
                alert('Logout failed');
            }
        };
        $.ajax('/scav_board/logout/', options)
    });

    // Search functionality
    $("#search-button").click(function(event) {
        event.preventDefault();
        executeSearchQuery($("#search-text").val(), -1);
    });

    $(".page-selector").each(function(idx, elem) {
        var target_page = parseInt($(elem).data("target"));
        $(elem).on('click', function(event) {
            event.preventDefault();
            executeSearchQuery("#page:" + target_page, target_page);
        });
    });

    app.pageInfoView = new PageInfoView();
    executeSearchQuery("#page:1", 1);
});

var executeSearchQuery = function(qstring, target_page) {
    if (app.currentPageView !== undefined)
        app.currentPageView.remove();

    app.currentThreadCollection = new ThreadCollection(make_search_query(qstring));
    $("#search-text").val(qstring);
    app.pageInfoView.render(target_page);
    app.currentPageView = new PageView(app.currentThreadCollection);
    $(document.body).append(app.currentPageView.$el);
    app.currentQuery = qstring;
    app.currentTarget = target_page;
};