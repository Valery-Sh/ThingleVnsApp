define(function (require) {
    var ThingsView = require('views/things/things-list');

    return Backbone.View.extend({
        auth: true,
        title: "People you follow",
        category:  "filter by",

        render:function () {
            var self = this;
            App.currentUser.checkAuth(function () {
                self._thingsView = new ThingsView({
                    el: self.el,
                    url: "/api/users/" + App.currentUser.get('_id') + "/followings/things",
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