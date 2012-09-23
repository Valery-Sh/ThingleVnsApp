define(function (require) {
    var html = require('text!tpl/profile/decks.html'),
        Decks = Backbone.Collection.extend({
            model:App.Models.Deck,
            initialize:function (user_id) {
                this.url = '/api/users/' + user_id + '/decks';
            }
        }),
        Things = Backbone.Collection.extend({
            model:App.Models.Thing,
            url:'/api/things'
        }),
        TitleView = require('views/title');

    return Backbone.View.extend({
        id: 'decks-list',

        template: _.template(html),
        events:{
            'click .delete-deck':'deleteDeck'
        },

        initialize: function () {
            this.options.userId = this.options.userId || this.options[0];
            /** Note, it seems as though self.options.userId is not always populated :/ */
            App.on('Deck:Removed', this.removeDeck, this);
        },

        /**
         * Click handler for deck deletion
         */
        deleteDeck: function (evt) {
            evt.preventDefault();
            console.log(evt);
            var deck_el = $(evt.target).parents('.item.deck'),
                deck_id = deck_el.data('id'),
                deck = new App.Models.Deck({id:deck_id, _id:deck_id});
            /**
             * The default actions and url builders seem mangled, should be fixed in model
             * This should be in Model.Deck in a more generic fashion
             */
            deck.destroy({url:deck.url + '/' + deck_id, wait:true,
                success:function (model, response) {
                    console.log('Delete Success');
                    console.log(model);
                    console.log(response);
                    alert('Replace me with a nicer popup\n' + response.msg);

                    App.trigger('Deck:Removed', response.data);
                },
                error:function (model, response) {
                    console.log('Delete Error');
                    console.log(model);
                    console.log(response);
                    alert('Replace me with a nicer popup\n' + response.responseText);
                }
            })
        },

        render: function () {
            var self = this;

            function _render() {
                self._isMyProfile = false;
                var title = "User's collections";

                self._isMyProfile = App.currentUser && App.currentUser.get('_id') == self.options.userId;
                if (self._isMyProfile) title = "Your Collections";

                var titleView = new TitleView({
                    title: title,
                    subtitle: '/profile/'
                });
                titleView.render();

                $(self.el).html(self.template({
                    things:self.things,
                    decks:self.decks,
                    isMyProfile:self._isMyProfile
                })).prepend(titleView.el);

                var user = new App.Models.User({_id: self.options.userId});
                App.view('profile', {
                    el:$('.profile-container', self.el),
                    user:user
                });
                user.fetch({
                    success: function(user) {
                        App.trigger("meta:change", {
                            title : user.get("firstName") + " " + user.get("lastName"),
                            description : user.get("firstName") + " " + user.get("lastName") + "'s profile on Thingle"
                        });
                    }
                });
            }

            self.getDecks(function (decks, things) {
                self.decks = decks;
                self.things = things;

                _render();
            });

            if (typeof App.currentUser.get('_id') == 'undefined') {
                App.currentUser.checkAuth(_render);
            }
        },

        _applyCurrentUser: function() {

        },

        /**
         * Subscriber to the Deck:Removed App event
         * Responsible for removing the Deck UI representation
         */
        removeDeck: function (evt) {
            console.log('profile/decks.removeDeck');
            console.log(evt);

            var deck_el = this.$el.find('.item.deck[data-id="' + evt.deck.id + '"]'),
                stat_el = $('.stats-collections');
            deck_el.fadeOut();
            //Deck count can't go below 1
            //TODO: Implement via a combination of User Model and request response.
            stat_el.text(parseInt(stat_el.text(), 10) - 1 || 1);
        },

        getDecks: function (cb) {
            var self = this,
                decks = new Decks(self.options.userId),
                thing_ids = [],
                things = new Things;


            decks.fetch({
                success:function (collection) {
                    console.log(collection);
                    if (collection.length == 0) {
                        if (typeof cb == 'function') cb(collection, things);
                        return;
                    }

                    _.each(collection.models, function (deck) {
                        deck.thing_ids = deck.get('things').slice(-4).reverse();
                        thing_ids = _.union(thing_ids, deck.thing_ids);
                    });

                    things.fetch({
                        data:{ids:thing_ids.join(',')},
                        success:function (things_collection) {
                            if (typeof cb == 'function') cb(collection, things_collection);
                        }
                    });
                }
            });
        }
    });
});