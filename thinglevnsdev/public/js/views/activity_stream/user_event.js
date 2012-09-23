define(function(require) {
    var html = require('text!tpl/activity_stream/user_event.html'),
        DateHelper = require('helpers/date'),
        TextHelper = require('helpers/text');

    return Backbone.View.extend({
        template: _.template(html),
        events: {
        },

        render: function() {
            var self = this;
            var data = {
                DateHelper: DateHelper,
                TextHelper: TextHelper,
                notification: this.options.notification,
                sender: this.options.notification.get("sender")
            };
            $(self.el).html(self.template(data));
            $(self.el).show();
        }
    });
});