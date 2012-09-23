define(function(require) {
    var html = require('text!tpl/things/show/editors.html'),
        DateHelper = require('helpers/date'),
        Users = App.Collections.Users;

    return Backbone.View.extend({
        id: 'editors',
        template: _.template(html),
        events: {
            'click .revert': "_revert"
        },
        navigation: "Editors",

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this._parent = this.options.parent;
            var self = this;
            this._parent.on("saveThingle", this.render, this);
            this._thing = this.options.thing;
        },

        render: function() {
            var self = this,
                users = new Users();
            users.fetch({
                data: {
                    ids: this._getEditorsIds().join(",")
                },
                success: function (collection) {
                    var editions = [
                        {
                            author: self._thing.get("updatedUser") ? self._thing.get("updatedUser")._id : self._thing.get("createdUser")._id,
                            createdAt: self._thing.get("updatedAt")
                        }
                    ];
                    editions = self._thing.get("editions").concat(editions).reverse();
                    var data = {
                        title: self.navigation,
                        curatorId: self._thing.get("createdUser")._id,
                        editions: editions,
                        users: self._getUsersByIdsMap(collection.models),
                        DateHelper: DateHelper
                    };
                    self.$el.html(self.template(data));
                    $('.scroll-pane', this.$el).jScrollPane();
                }
            });
        },

        _getEditorsIds: function () {
            var usersIds = [this._thing.get("updatedUser") ? this._thing.get("updatedUser")._id : this._thing.get("createdUser")._id,],
                editions = this._thing.get("editions");
            for(var i = 0; i < editions.length; ++i) {
                usersIds.push(editions[i].author);
            }
            return usersIds;
        },

        _getUsersByIdsMap: function (models) {
            var map = {};
            for (var i = 0; i < models.length; ++i) {
                map[models[i].get("_id")] = models[i];
            }
            return map;
        },

        _revert: function(e) {
            var self = this,
                revision = $(e.target).data("revision");
            $.ajax({
                url:"/api/things/" + this._thing.get("_id") + "/revisions/" + revision + "/revert",
                success: function () {
                    self._parent.render();
                }
            });
            return false;
        }
    });
});