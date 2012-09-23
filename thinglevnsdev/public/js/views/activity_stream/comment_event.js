define(function(require) {
    var html = require('text!tpl/activity_stream/comment_event.html'),
        DateHelper = require('helpers/date'),
        TextHelper = require('helpers/text'),
        Thing = App.Models.Thing,
        Comment = App.Models.Comment;

    return Backbone.View.extend({
        template: _.template(html),
        _requests: 0,
        events: {
        },
        data: {
            DateHelper: DateHelper,
            TextHelper: TextHelper
        },

        _initialize: function () {
            this.data.notification = this.options.notification;
        },

        _putContent: function () {
            this._requests --;
            if (this._requests == 0)
                $(this.el).html(this.template(this.data));
        },

        render: function() {
            var self = this;

            this._requests = 2;

            var thing = new Thing();
            thing.set("_id", this.options.notification.get("objects").thing);
            thing.fetch({
                success: function (thing) {
                    self.data.thing = thing;
                    self._putContent();
                }
            });

            var comment = new Comment({thing: this.options.notification.get("objects").thing});
            comment.set("_id", this.options.notification.get("objects").comment);
            comment.fetch({
                success: function (comment) {
                    self.data.comment = comment;
                    self._putContent();
                }
            });
        }
    });
});