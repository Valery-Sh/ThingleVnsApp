define(function(require) {
    var html = require('text!tpl/things/show/collectors.html'),
        Users = App.Collections.Users;

    return Backbone.View.extend({

        limit: 5,

        id: 'collectors',
        template: _.template(html),
        events: {
        },
        navigation: "Collectors",

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this._parent = this.options.parent;
            this._thing = this.options.thing;
            this._usersMap = {};
            var self = this;
            App.currentUser.checkAuth(function () {
                self._usersMap[App.currentUser.get("_id")] = App.currentUser;
            });
            App.on('afterRepost', this._onRepost, this);
        },

        render: function() {
            var self = this,
                collectors = this._getUniqueCollectors(this._thing.get("collectors")),
                users = new Users();

            if (collectors.length > 0) {
                users.fetch({
                    data: {
                        ids: collectors
                    },
                    success: function (collection) {
                        self._addUsersInMap(collection.models);
                        self._showBlock(collectors);
                    }
                });
            } else {
                self._showBlock(collectors);
            }
        },

        _showBlock: function (collectors) {
            for (var i = 0; i < collectors.length; ++ i) {
                collectors[i] = this._usersMap[collectors[i]];
            }
            this.$el.html(this.template({
                title: this.navigation,
                collectors: collectors
            }));
            if (collectors.length == 0) {
                $("a[target='#" + this.id + "']").parent("li").hide();
                this.$el.hide();
            } else {
                $("a[target='#" + this.id + "']").parent("li").show();
                this.$el.show();
            }
        },

        _addUsersInMap: function (models) {
            for (var i = 0; i < models.length; ++i) {
                this._usersMap[models[i].get("_id")] = models[i];
            }
        },

        _onRepost: function (data) {
            if (data.thingle_id == this._thing.get("_id")) {
                var collectors = this._thing.get("collectors");
                collectors.push(App.currentUser.get("_id"));
                this._showBlock(this._getUniqueCollectors(collectors));
            }
        },

        _getUniqueCollectors: function (collectors) {
            return $.unique([].concat(collectors).reverse()).slice(this.limit * (-1)).reverse(); // Concat - to clone array. Twice reverse() - to repair order after $.unique() calling.
        }
    });
});