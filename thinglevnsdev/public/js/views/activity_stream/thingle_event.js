define(function(require) {
    var html = require('text!tpl/activity_stream/thingle_event.html'),
        DateHelper = require('helpers/date'),
        TextHelper = require('helpers/text'),
        Thing = App.Models.Thing;

    return Backbone.View.extend({
        template: _.template(html),
        events: {
        },

        render: function() {
            var self = this;
            var data = {
                DateHelper: DateHelper,
                TextHelper: TextHelper,
                notification: this.options.notification
            };
            var thing = new Thing();
            thing.set("_id", this.options.notification.get("objects").thing);
            thing.fetch({
                success: function (thing) {
                    data.thing = thing;
                    $(self.el).html(self.template(data));
                    $(self.el).show();
                }
            });
        }
    });
});