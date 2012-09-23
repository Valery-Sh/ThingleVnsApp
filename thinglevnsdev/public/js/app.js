require.config({
    baseUrl:'/js',
    paths:{
        'text':'lib/text'
    }
});

var App = {};

_.extend(App, Backbone.Events);


App.history = {};

/**
 * Method to render page and keep its state.
 */
App.page = function (viewName, args, saveState, cb) {
    App.trigger("meta:reset");
    
    if (typeof saveState == "function") {
        cb = saveState;
        saveState = false;
    }
    saveState = saveState ? saveState : false;

    var currentPageId = document.location.hash.replace(/\W+/g, "-");
    currentPageId = currentPageId || "-";

    if (saveState && $("#content #main").data("viewName")) {
        // Save page state
        var $container = $("#content #main");
        App.history[$container.data("viewName")] = {
            page: $container,
            scroll: $("#content").scrollTop()
        };
        $container.detach();
        $container.data('view').undelegateEvents();
        $("#content").prepend($('<section id="main" />'));
        delete $container;
    }

    if (App.history[currentPageId] && $("#content #main").data("restoreState")) {

        // Restore page state
        $("#content #main").remove();
        $("#content").append(App.history[currentPageId].page);
        $("#content").scrollTop(App.history[currentPageId].scroll);
        App.history[currentPageId].page.data("view").delegateEvents();
    } else {

        // Render new page
        $("#content #", currentPageId).empty().remove();
        $("#content #main").data("viewName", currentPageId);
        App.view(viewName, args, saveState, function () {
            if (typeof cb == "function") {
                cb();
            }
            $("#content #main").data("view", App.currentPage);
        });
    }
    delete App.history[currentPageId];
    $("#content #main").data("restoreState", saveState);
}

App.view = function (viewName, args, saveState, cb) {
    if (typeof saveState == "function") {
        cb = saveState;
        saveState = false;
    }

    require(['views/' + viewName, 'views/titled'], function (View, TitledView) {
        var view = new View(args);

        if (view.title) {
            var titledView = new TitledView({
                title: view.title,
                subtitle: view.category ? "/ " + view.category + " /": "",
                view: view
            });
            titledView.auth = view.auth;
            view = titledView;
        }

        var render = function () {
                view.render();
                if ($(view.el).parents().length === 0) {
                    if (typeof App.currentPage == 'object') {
                        if (typeof App.currentPage.destroy == 'function') App.currentPage.destroy();
                        if (!saveState) {
                            App.currentPage.remove();
                            App.currentPage.undelegateEvents();
                        }
                        view.delegateEvents(); // because undelegate could destroy current view events
                    }
                    $("section#main").empty().append($(view.el));
                    //App.Helpers.layoutHelper.reinitContentScroll();
                    //$('.scroll-pane','#content').data('jsp').scrollToY(0);
                    App.currentPage = view;
                }// Should we be passing the instantiated view as a param to the CB?
                if (typeof cb == 'function') cb(); 
            };

        if (view.auth) {
            App.currentUser.checkAuth(render, true);
        }
        else render();
    });
};

App.popup = function (popupName, args) {
    var elementId = popupName.replace("/", "-") + "-popup";
    $('#' + elementId).remove();
    var $popup = $('<div class="modal fade thingle-modal" />').attr('id', elementId);
    $('body').append($popup);

    args = args || {};
    args.el = $popup;
    App.view('popups/' + popupName, args, function () {
        $popup.modal('show');
    });
    return $popup;
};

App.init = function (cb) {
    var init = function() {
        require(['helpers', 'models', 'analytics', 'metadata', 'backbone-override'], function (helpers, models) {
            App.Helpers = helpers;
            App.Models = models.Models;
            App.Collections = models.Collections;

            App.currentUser = new App.Models.CurrentUser();

            var layout_helper = $('body').attr('helper'),
                loadViews = function(){
                    $('[view]').each(function () {
                        App.view($(this).attr('view'), {el:this});
                    });
                };

            App.isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);

            if (App.isMobile) {
                $('body').addClass('touch');
            };
            
            if (typeof layout_helper != 'undefined') {
                require(['helpers/' + layout_helper], function (LayoutHelper) {
                    App.Helpers.layoutHelper = new LayoutHelper();
                    loadViews();
                });
            }
            else loadViews();

            if (typeof cb == 'function') cb();

            // Welcome Popup
            require(['helpers/cookie'], function (CookieHelper) {
                if (!CookieHelper.getCookie('visited')) {
                    CookieHelper.setCookie('visited',true,{expires:9999999999});
                    App.popup('welcome');
                }
            });
        });
    }
    
    var Config = Backbone.Model.extend({
        url:'/api/config'
    });
    App.Config = new Config();
    App.Config.fetch({
        success: init
    });

};

function splitPath(path) {
    var pathNames = new Array();
    var query = {};
        
    var tokens = path.split(/[/?&#]/);
    for (var i = 0 ; i < tokens.length ; i++) {
        var tuple = tokens[i].split("=");
        if (tuple.length == 1) {
            pathNames.push(tuple[0]);
        } else {
            query[tuple[0]] = tuple[1];
        }
    }
    pathNames.push(query);
    return pathNames;
}

App.Router = Backbone.Router.extend({

    routes:{
        '':'list_things',
        '?q=:q':'list_things',
        'things/new':'new_thing',
        'things/*path':'thing_details',
        'bookmarklet?*query':'bookmarklet',
        'decks/:id':'list_decks',
        'categories/:id':'category_page',
        'profile': 'profile',
        'profile/friends/things': 'profile_friends_things',
        'profile/things/liked':'profile_liked_things',
        'profile/*path': 'profile',
        'activity': 'activity_stream',
        /* -------------------- */
        'sett': 'sett',
        'users/:id': 'user_decks',
        'users/:id/decks': 'user_decks',
        'users/:id/things/best': 'user_best_things',
        'followings/things': 'followings_things',
        //'mingle/facebook/invite': 'mingle_fb_friends',
        'mingle':'user_mingle',
        'mingle/*path':'user_mingle'
    },
    sett : function() {
       alert("******** CCCC ************");
       return false;
    },
    list_decks: function () {
        App.page('decks/index', arguments);
    },
    new_thing: function () {
        App.page('things/new', arguments);
    },
    list_things: function () {
        App.page('things/index', arguments);
    },
    thing_details: function (path) {
        var options = splitPath(path);
        App.currentUser.authenticate(options[options.length - 1]["access_token"], function() {
            App.page('things/show', options, true);
        });
    },
    category_page: function (tag) {
        App.page('things/things-list', {
            el: this.el,
            title: decodeURIComponent(tag),
            category: "thingles",
            url: "/api/tags/" + tag + "/things",
            showDeleteButton: true
        });
    },
    bookmarklet: function (query) {
        var segments = query.split("&");
        var params = {};
        for(var i = 0; i < segments.length; ++i) {
            var segment = segments[i].split("=");
            var existingValue = params[segment[0]];
            if (existingValue) {
                if (!(existingValue instanceof Array)) {
                    var array = new Array();
                    array.push(existingValue);
                    params[segment[0]] = array;
                }
                params[segment[0]].push(decodeURIComponent(segment[1]));
            } else {
                params[segment[0]] = decodeURIComponent(segment[1]);
            }
        }
        App.view('bookmarklet/index', params);
    },
    profile: function (path) {
        var self = this;
        App.currentUser.checkAuth(function() {
          //One apparent problem with this approach is:
          //that it clobbers the back button functionality
            self.navigate('users/' + App.currentUser.get('_id') + (path ? '/' + path : ''),
              {trigger: true});
        }, true);
    },
    profile_liked_things: function () {
        App.page('profile/liked_things', arguments);
    },
    profile_friends_things: function () {
        App.page('profile/friends_things', arguments);
    },
    activity_stream: function () {
        App.page('activity_stream', arguments);
    },
    user_decks: function () {
        App.page('profile/decks', arguments);
    },
    user_best_things: function () {
        App.page('profile/best_things', arguments);
    },
    followings_things: function () {
        App.page('followings/things', arguments);
    },
    user_mingle: function(path){
        App.currentUser.autoAuth(function() {
        App.view('mingle/mingle-root', {path:"mingle/"+path});
      }, true);
    },

    initialize: function () {
        this.route(/^(about|contact|privacy|terms|legal|help|404)(\/.*)?/, 'static', function () {
            App.trigger("meta:reset");
            App.view('static');
        });
    }
});

$(document).ready(function () {
    App.init(function () {
        App.router = new App.Router();
        Backbone.history.start();
        App.trigger('load');
        console.log('loaded');
    });
})
