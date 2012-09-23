define(function (require) {
    var TitleView = require('views/title');

    return Backbone.View.extend({

        render: function () {
            var titleView = new TitleView({
                title: this.options.title,
                subtitle: this.options.subtitle
            });
            titleView.render();

            $(this.el).append($(titleView.el));
            if (this.options.view) {
                this.options.view.render();
                $(this.el).append($(this.options.view.el));
            }
            if (this.options.html) {
                $(this.el).append($(this.options.html));
            }
        },

        undelegateEvents: function() {
            if (this.options.view && typeof this.options.view.undelegateEvents == "function") {
                this.options.view.undelegateEvents();
            }
            return this;
        },

        delegateEvents: function() {
            if (this.options.view && typeof this.options.view.delegateEvents == "function") {
                this.options.view.delegateEvents();
            }
            return this;
        }
    });
});