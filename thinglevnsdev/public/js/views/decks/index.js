define(function (require) {
    var Deck = App.Models.Deck;

    return Backbone.View.extend({

        render:function () {
            var self = this;
            (new Deck()).fetch({
                url:"/api/decks/" + self.options[0],
                success:function (doc) {
                    var $thingsList = $("<div></div>");
                    $(self.el).append($thingsList);
                    var deckOwnerId = doc.get("user")._id || doc.get("user")
                    App.view('things/things-list', {
                        el: $thingsList,
                        url: "/api/decks/" + self.options[0] + "/things",
                        deckOwnerId: deckOwnerId,
                        showDeleteButton: deckOwnerId == App.currentUser.get("_id"),
                        title: doc.get("name"),
                        category: "collections"
                    });

                    var $profile = $('<div class="profile-container" />');
                    $($thingsList).prepend($profile);
                    var user = new App.Models.User({_id: doc.get('user')._id});
                    App.view('profile', {el:$profile, user:user});
                    user.fetch({
                        success: function(user) {
                            App.trigger("meta:change", {
                                title : doc.get("name"),
                                description : "'" + doc.get("name") + "' by " 
                                    + user.get("firstName") + " " + user.get("lastName"),
                                keywords : doc.get("tags")
                            });
                        }
                    });

                    $($thingsList).on("onItemRemove", $.proxy(self, "onItemRemove"));
                }
            });
        },

//        undelegateEvents: function() {
//            this.thingsView.undelegateEvents();
//            return this;
//        },

//        delegateEvents: function() {
//            this.thingsView.delegateEvents();
//            return this;
//        },

        onItemRemove:function (event, id) {
            $.ajax({
                type:"DELETE",
                url:"/api/decks/" + this.options[0] + "/things/" + id
            });
        }
    });
});