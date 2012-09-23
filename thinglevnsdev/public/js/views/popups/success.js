define(function (require) {
    var html = require('text!tpl/popups/success.html');

    return Backbone.View.extend({
        template:_.template(html),

        events: {
            'click a.inner-link': "_forwardToLink",
            'click #add-more-link': "_addMore"
        },

        initialize: function () {
            if (typeof this.options.beforeHide == "function") {
                var self = this;
                $(this.el).on('hide', function () {
                    self.options.beforeHide();
                    return true;
                });
            }
            if (typeof this.options.afterHide == "function") {
                $(this.el).on('hide', this.options.afterHide);
            }
        },

        render:function () {
            var html = this.template({
                thing: this.options.thing,
                src: this.options.src,
                title: this.options.title || "Congrats! Your Thingle is live"
            });
            $(this.el).html(html);
        },

        _forwardToLink: function (e) {
            if (typeof this.options.onForward == "function") {
                typeof this.options.onForward($(e.target).attr("href"));
            }
            $(this.el).modal('hide');
        },

        _addMore: function () {
            $(this.el).modal('hide');
            App.popup('thingles/new-popup-2', {
                thingle: this.options.thing
            });
        }
    });
});