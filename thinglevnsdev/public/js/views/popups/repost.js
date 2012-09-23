define(function (require) {
    var html = require('text!tpl/popups/repost.html'),
        Thing = App.Models.Thing,
        selectHelper = require("helpers/select");

    return Backbone.View.extend({
        auth:true,
        events:{
            'click #repost-button':'_onFormSubmit'
        },
        template:_.template(html),

        render:function () {
            var self = this;
            this._thing_id = this.options.thingId;
            this._loadThing(
                function (thing) {
                    self._loadDecks(
                        function (decks) {
                            self._renderPopupAndShow(thing, decks);
                        }
                    );
                }
            );
        },

        _loadThing:function (cb) {
            var self = this;
            var thing = new Thing();
            thing.fetch({
                url:"/api/things/" + this._thing_id,
                success:function (model) {
                    self._thing = model;
                    cb(model);
                }
            });
        },

        _loadDecks:function (cb) {
            var Decks = Backbone.Collection.extend({
                model:App.Models.Deck,
                url:'/api/users/' + App.currentUser.get("_id") + "/decks"
            });
            var decks = new Decks();
            decks.fetch({
                success:function (collection) {
                    cb(collection.models);
                }
            });
        },

        _renderPopupAndShow:function (thing, decks) {
            var html = this.template({
                thing:thing,
                decks:decks
            });
            $(this.el).html(html);
            selectHelper.customize(this.el);
            $(this.el).modal("show");
        },

        _onFormSubmit:function () {
            
            var self = this,
                deck_id = $('select[name="deck"]', $(this.el)).val();
            
            var share = self.$('[name=share]').attr('checked') ? true : false;
            
            $.ajax({
                type:'POST',
                url:"/api/decks/" + deck_id + "/things",
                data:{
                    thingId:this._thing.get("_id"),
                    share:share
                },
                dataType:"json",
                success: function () {
                    App.trigger('afterRepost', {collection_id: deck_id, thingle_id: self._thing.get("_id")});
                }
            });
            $(this.el).modal('hide');
            if ($("#post-facebook", $(this.el)).attr("checked")) this._postToFaceBook();

            App.popup("success", {thing: this._thing, title: "Congrats! Thingle is reposted"});
            if (typeof this.options.onSubmit == 'function') this.options.onSubmit();
//            App.trigger('onRepost', {collection_id: deck_id, thingle_id: self._thing.get("_id")});
        },

        _postToFaceBook:function () {
            console.log("TODO: - Post to Facebook");
        }
    });
});