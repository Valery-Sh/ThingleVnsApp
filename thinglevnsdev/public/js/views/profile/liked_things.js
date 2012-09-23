define(function (require) {
    var ThingsView = require('views/things/things-list');

    return Backbone.View.extend({
        auth: true,
        title: "All the things you loved",
        category:  "filter by",

        render:function () {
            var self = this;
            App.currentUser.checkAuth(function () {
                self._thingsView = new ThingsView({
                    el: self.el,
                    url: "api/profile/things/liked",
                    showDeleteButton: true
                });
                self._thingsView.render();
            });
        },

        undelegateEvents: function() {
            if (this._thingsView && typeof this._thingsView.undelegateEvents == "function") {
                this._thingsView.undelegateEvents();
            }
            return this;
        },

        delegateEvents: function() {
            if (this._thingsView && typeof this._thingsView.delegateEvents == "function") {
                this._thingsView.delegateEvents();
            }
            return this;
        }
    });
});