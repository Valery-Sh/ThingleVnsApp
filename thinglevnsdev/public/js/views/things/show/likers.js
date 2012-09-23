define(function(require) {
    var html = require('text!tpl/things/show/likers.html'),
        Users = App.Collections.Users;

    return Backbone.View.extend({

        limit: 5,

        id: 'likers',
        template: _.template(html),
        events: {
        },
        navigation: "Lovers",

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this._parent = this.options.parent;
            this._thing = this.options.thing;
            App.on('onLikeSuccess', this._onLike, this);
        },

        render: function() {
            var self = this,
                likers = this._thing.get("likers"),
                users = new Users();

            likers = likers ? likers.slice(this.limit * (-1)).reverse() : [];
            if (likers.length > 0) {
                users.fetch({
                    data: {
                        ids: likers.join(",")
                    },
                    success: function (collection) {
                        var usersMap = self._getUsersByIdsMap(collection.models);
                        for (var i = 0; i < likers.length; ++ i) {
                            likers[i] = usersMap[likers[i]];
                        }
                        self._showBlock(likers);
                    }
                });
            } else {
                self._showBlock(likers);
            }
        },

        _showBlock: function (likers) {
            this.$el.html(this.template({
                title: this.navigation,
                likers: likers
            }));
            if (likers.length == 0) {
                $("a[target='#" + this.id + "']").parent("li").hide();
                this.$el.hide();
            } else {
                $("a[target='#" + this.id + "']").parent("li").show();
                this.$el.show();
            }
        },

        _onLike: function (data) {
            if (data.thingId == this._thing.get("_id")) {
                this.render();
            }
        },

        _getUsersByIdsMap: function (models) {
            var map = {};
            for (var i = 0; i < models.length; ++i) {
                map[models[i].get("_id")] = models[i];
            }
            return map;
        }
    });
});