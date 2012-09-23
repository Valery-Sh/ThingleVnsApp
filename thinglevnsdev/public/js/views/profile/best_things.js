define(function (require) {
    var ThingsView = require('views/things/things-list');

    return Backbone.View.extend({
        auth: true,

        id: "best-things",
        title: "Your most popular thingles:",
        category:  "filter by",

        initialize: function () {
            this.options.userId = this.options.userId || this.options[0];
            this._thingsView = new ThingsView({
                el: this.el,
                url: "/api/users/" + this.options.userId + "/things/?order=likes",
                showDeleteButton: true
            });
        },

        render:function () {
            this._thingsView.render();
        },

        undelegateEvents: function() {
            if (typeof this._thingsView.undelegateEvents == "function") {
                this._thingsView.undelegateEvents();
            }
            return this;
        },

        delegateEvents: function() {
            if (typeof this._thingsView.delegateEvents == "function") {
                this._thingsView.delegateEvents();
            }
            return this;
        }
    });
});