define(function (require) {
    var ThingsView = require('views/things/things-list');

    return Backbone.View.extend({
        auth: true,
        id: "friends-things",

        title: "All your friends",
        category:  "filter by",

        initialize: function () {
            this._thingsView = new ThingsView({
                el: this.el,
                url: "/api/profile/friends/things",
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