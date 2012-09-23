define(function(require) {
    var html = require('text!tpl/activity_stream.html'),
    DateHelper = require('helpers/date'),
    Notifications = new App.Collections.Notifications,
    Notification = App.Models.Notification,
    detailsTpl = _.template(require('text!tpl/activity_stream/_details.html')),

    thingleEvent = require('views/activity_stream/thingle_event'),
    commentEvent = require('views/activity_stream/comment_event'),
    userEvent = require('views/activity_stream/user_event'),
        
    eventsMap = {
        thing_like: thingleEvent,
        thing_comment: commentEvent,
        thing_collect: thingleEvent,
        thing_change: thingleEvent,
        thing_share: thingleEvent,
        friend_join: userEvent,
        user_follow: userEvent
    };
    
    //vns----------------------
    var SettingsModel = Backbone.Model.extend({
        
    });
    var SettingsCollection = Backbone.Collection.extend({
        model : SettingsModel
    });
    
    require('lib/jquery.tools.min');
    require("lib/bootstrap/bootstrap-button-event"); //!!! vns
    
    var userSettings = getUserSettings()
    
    var settingsCollection = new SettingsCollection;
    
    settingsCollection.add( [
        { id : 0,
          title : "Comments",
          value : userSettings.comments
        },
        { id : 1,
          title : "Favoriting",
          value : userSettings.favoriting
        },
        { id : 2,
          title : "Reposting",
          value : userSettings.reposting
        },
        { id : 3,
          title : "Editing",
          value : userSettings.editing
        },
        { id : 4,
          title : "Following",
          value : userSettings.following
        }        
    ])
    
    //var mmm = settingsCollection.get(1)
    //alert("MMM=" + mmm.id)
    function getUserSettings() {

        var userSettings = App.currentUser.get('notificationsSettings');
        alert("userId=" + App.currentUser.url() + "; userSettings=" + userSettings)
        if ( ! userSettings) {
            alert("create userSettings=")
            userSettings = {
                comments : -1,
                favoriting : -1,
                reposting :  -1,
                editing :    -1,
                following :  -1
            }
            App.currentUser.set('notificationsSettings',userSettings)
            //App.currentUser.save()
            // update session
             
            // update database
            
        }
        var u = App.currentUser.get('notificationsSettings');
        alert("UUUUUUUUUUUU " + u.comments)
        return App.currentUser.get('notificationsSettings');
    }
    
    return Backbone.View.extend({
        auth: true,

        title: "Activity Stream",
        category:  DateHelper.format(new Date, "%l, %F %j%S, %Y"),

        template: _.template(html),
        events: {
            'click .notification': '_onNotificationClick'
            ,
            'click .block-title': '_onBlockTitleClick' //!!!vns
            ,
            'change .btn-group button': '_onBtnGroupChange' //!!!vns
        },
        _onBtnGroupChange: function (evt,targetIndex) {
            //alert("VALUE: " + $(evt.currentTarget).hasClass('active') + "; idx=" + targetIndex)
            var id =  $(evt.currentTarget).attr("_id")
            alert("_id = " + id)
            var model = settingsCollection.get(id);
            if ( $(evt.currentTarget).hasClass("active")) {
                model.set("value",targetIndex);
            } else {
                model.set("value",-1);
            }
            var userSettings = App.currentUser.get('notificationsSettings');
            userSettings.comments = model.get("value");
            App.currentUser.set('notificationsSettings',userSettings);
            userSettings = App.currentUser.get('notificationsSettings');            
            alert("userSettings.comments="+userSettings.comments)
            App.currentUser.save({},{
                    success:function () {
//                        self._authenticated = true;
//                        self.id = 'default';
                        console.log('--------------- user saved');
//                        App.trigger('auth');
//                        if (typeof cb == 'function') cb();
                    },
                    error:function (model, response) {
//                        if (response.status == 401) self._authenticated = false;
//                        App.trigger('auth-failed');
//                        if (typeof cb == 'function') cb();
                        console.log('----------- save error');

                    }
                })
            //model.set
        },
        _onBlockTitleClick: function (evt) {
            $('.notifications-panel-toggle').toggleClass('active');
            $('.notifications .block-inner').toggle();
        },

        _onNotificationClick: function (evt) {
            this._openNotification(evt.currentTarget);
        },

        _openNotification: function (el) {
            var self = this;
            $(".notification", this.el).removeClass("active");
            $(el).addClass("active");
            $("section", self.el).fadeOut(100);
            var notification = new Notification();
            notification.set("_id", $(el).data("id"));
            notification.fetch({
                success: function (data) {
                    $("section", self.el).html(detailsTpl({
                        notification: data,
                        DateHelper: DateHelper
                    }));
                    $("section", self.el).fadeIn(100);

                    var view = new eventsMap[data.get("type")]({
                        notification: data,
                        el: $("section .stream-content", self.el)[0]
                    });
                    view.render();
                }
            });
        },

        render: function () {
            //var settings = new SettingsModel({fieldName: "MyComments",rightAway: true,daily:false,weekly:true});

            var self = this;
            Notifications.fetch({
                data: {
                    limit: 63
                },
                success: function (collection) {
                    var st = {};
                    $(self.el).html(self.template({
                        DateHelper: DateHelper,
                        models: collection.models
                       ,nsModels: settingsCollection
                        
                    }));
                    $('.scrollable', this.el).scrollable().navigator();
                    self._openNotification($(".notification:first", $(self.el)));
                    // !! vns
                    var c = $("td button:contains('_')")
                    //alert("RENDER: c.length=" + c.length)
                }
            });
        }
    });
});