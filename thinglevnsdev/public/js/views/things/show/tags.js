define(function(require) {
    var html = require('text!tpl/things/show/tags.html');

    return Backbone.View.extend({
        id: 'tags',
        template: _.template(html),
        events: {
            'click .tags-list .tag. .remove': '_onTagRemove',
            'submit form': '_onFormSubmit'
        },
        navigation: "Tags",

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this._parent = this.options.parent;
            this._thing = this.options.thing;

            App.on('addToDeck', this._onAddToDeck, this);
        },

        render: function() {
            this.$el.html(this.template({
                title: this.navigation,
                thing: this._thing
            }));
            this.$form = $('form', this.$el);
            this.form = this.$form[0];
        },

        _onAddToDeck: function () {

        },

        _onTagRemove: function (e) {
            var $tag = $(e.target).parents(".tag");
            $tag.remove();
            var tags = this._thing.get('tags');
            var tagIndex = tags.indexOf($tag.data('tag'));
            if (tagIndex >= 0) {
                tags.splice(tagIndex, 1);
                this._thing.set('tags', tags);
                this._parent.updateThingle();
            }
        },

        _onFormSubmit: function () {
            var tags = this.$form.find("[name='tags']").val();
            if (tags) {
                tags = tags.replace(/(\s*,\s*)+/g, ",").split(",");
                tags = tags.concat(this._thing.get('tags'));
                this._thing.set('tags', $.unique(tags));
                this._parent.updateThingle();
                this.render();
            }
            return false;
        }
    });
});