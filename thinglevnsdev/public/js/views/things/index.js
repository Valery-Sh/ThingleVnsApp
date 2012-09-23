define(function (require) {
    var TitledView = require('views/titled'),
        ThingsView = require('views/things/things-list');

    return Backbone.View.extend({

        initialize: function () {
            this.title = this.options[0] ? decodeURIComponent(this.options[0]) : null;
            this.category = this.options[0] ? "search result": null;
            this._thingsView = new ThingsView({
                el: this.el,
                url: this.options[0] ? "/api/things?q=" + this.options[0] : "/api/things"
            });
        },

        render:function () {
            this._thingsView.render();
        },

        undelegateEvents: function() {
            this._thingsView.undelegateEvents();
            return this;
        },

        delegateEvents: function() {
            this._thingsView.delegateEvents();
            return this;
        }

    });
});