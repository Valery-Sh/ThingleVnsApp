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

    require('lib/jquery.tools.min');

    return Backbone.View.extend({
        auth: true,

        title: "Activity Stream",
        category:  DateHelper.format(new Date, "%l, %F %j%S, %Y"),

        template: _.template(html),
        events: {
            'click .notification': '_onNotificationClick'
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
            var self = this;
            Notifications.fetch({
                data: {
                    limit: 63
                },
                success: function (collection) {
                    $(self.el).html(self.template({
                        DateHelper: DateHelper,
                        models: collection.models
                    }));
                    $('.scrollable', this.el).scrollable().navigator();
                    self._openNotification($(".notification:first", $(self.el)));
                }
            });
        }
    });
});