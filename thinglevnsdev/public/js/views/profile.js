define(function (require) {
    var html = require('text!tpl/profile.html');

    return Backbone.View.extend({
        id:'profile',
        template:_.template(html),
        events:{
            'click #follow-btn':'_follow',
            'click #unfollow-btn':'_unfollow'
        },

        initialize:function () {
            this.user = this.options.user || new App.Models.User({_id: this.options.userId});
            this.stats = this.options.stats;
        },

        _follow:function () {
            this.user.follow(function () {
                $('#follow-btn', this.el).hide();
                $('#unfollow-btn', this.el).show();
            });
        },

        _unfollow:function () {
            this.user.unfollow(function () {
                $('#follow-btn', this.el).show();
                $('#unfollow-btn', this.el).hide();
            });
        },

        render:function () {
            var self = this;

            this.user.fetch({
                success:function (user) {
                    console.log(user);
                    /** All the stats should probably come from the user data */
                    self.stats = _.extend(user.get('stats'), self.stats);

                    _.defaults(self.stats, {thinglesCreated:0, thingles:0, collections:0, likedBy:0, likes:0, thinglesRepostedBy:0});

                    var authenticated = App.currentUser.get('_id') ? true : false,
                        isMyProfile = authenticated && (App.currentUser.get('_id') == self.user.get("_id")),
                        canFollow = authenticated && !isMyProfile && App.currentUser.get('followings').indexOf(self.user.get("_id")) < 0;
                    $(self.el).html(self.template({
                        user:user,
                        authenticated: authenticated,
                        isMyProfile: isMyProfile,
                        canFollow: canFollow,
                        stats: self.stats
                    }));

                    var $masonry = $(self.el).parents('.masonry');
                    if ($masonry.length > 0) $masonry.masonry('reload');
                }
            })

        }
    });
});