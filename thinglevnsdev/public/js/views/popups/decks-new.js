define(function (require) {
    var Deck = App.Models.Deck,
        Category = App.Models.Category,
        Categories = Backbone.Collection.extend({
            model:Category,
            url:'/api/categories'
        }),
        html = require('text!tpl/popups/decks-new.html'),
        SelectHelper = require("helpers/select");

    return Backbone.View.extend({
        auth:true,
        events:{
            'submit form#create-deck-form':'_onFormSubmit'
        },
        template:_.template(html),

        initialize:function () {
            var self = this;
            this.categories = new Categories();
            $(this.el).on("hidden", function () {
                self._resetForm();
            });
        },

        _onFormSubmit:function (event) {
            var name = $("input[name='name']", $(event.target)).val();
                category_id = $("select[name='category'] option:selected", $(event.target)).val();
                category = $("select[name='category'] option:selected", $(event.target)).data("name");
                tags = category + "," + $('input[name=tags]', $(event.target)).val();
            tags = tags.replace(/(^[\s,]*|[\s,]*$)/g, "").replace(/(\s*,\s*)+/g, ",").split(",");
            var errors = [];
            if (!name) errors.push("Name can't be blank");
            if (!category_id) errors.push("Category can't be blank");

            if (errors.length > 0) {
                alert(errors.join("\n"));
            } else {
                this._saveDeck({
                    name: name,
                    tags: tags,
                    category: category_id
                });
            }

            return false;
        },

        _saveDeck:function (params) {
            var self = this;
            var category = params.category;
            delete params.category;
            var deck = new Deck();
            deck.set(params);
            deck.save({}, {
                success:function (model, response) {
                    $(self.el).modal('hide');
                    $(self.el).trigger("deckCreationComplete", [model]);
                    App.trigger('deckCreated', {deck_id:model.get("_id")});
                }
            });
        },

        _resetForm:function () {
            $("form#create-deck-form", $(this.el))[0].reset();
        },

        render:function () {
            var self = this;
            this.categories.fetch({
                success:function (collection) {
                    $(self.el).html(self.template({
                        categories:collection.models
                    }));
                    SelectHelper.customize(self.el);

                    if (self.options.deckName) {
                        self.$('input[name=name]').val(self.options.deckName);
                    }
                }
            });
        }
    });
});