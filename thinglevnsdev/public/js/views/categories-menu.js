define(function (require) {
    var html = require('text!tpl/category-menu.html'),
        Categories = Backbone.Collection.extend({
            model:App.Models.Category,
            url:'/api/categories'
        });

    var view = Backbone.View.extend({
        el:'#categories-menu',
        template:_.template(html),

        initialize:function () {
            this.categories = new Categories();
        },

        render:function () {
            var self = this;
            this.categories.fetch({
                success:function (collection) {
                    $(self.el).prepend(self.template({
                        categories:collection.models
                    }));
                }
            });
        }
    });

    return view;
});