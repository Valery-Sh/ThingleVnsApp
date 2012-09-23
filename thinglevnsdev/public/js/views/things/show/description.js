define(function(require) {
    var html = require('text!tpl/things/show/description.html'),
        TextHelper = require('helpers/text');

    return Backbone.View.extend({
        id: 'desc',
        template: _.template(html),
        events: {
            'click .btn-cancel': '_closeFrom',
            'submit form': '_onFormSubmit'
        },
        navigation: "Description",

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this.$el.on("edit", $.proxy(this._toggleEditForm, this));
            this._parent = this.options.parent;
            this._thing = this.options.thing;
        },

        render: function() {
            var data = {
                thing: this._thing
            };
            _.extend(data, TextHelper);
            this.$el.html(this.template(data));
            this.$form = $('form', this.$el);
            this.form = this.$form[0];
        },

        _toggleEditForm: function(e, editable) {
            if (editable) {
                var height = $('.desc-content').height();
                $('.desc-content p', this.$el).remove();
                $('.desc-content', this.$el).prepend("<textarea style='height:"+height+"px;'>" + this._thing.get("description") + "</textarea>");
            } else {
                $('.desc-content textarea', this.$el).remove();
                $('.desc-content', this.$el).prepend("<p>" + TextHelper.nl2br(this._thing.get("description")) + "</p>");
            }
        },

        _onFormSubmit: function () {
            this._parent.updateThingle({
                description: _.escape(this.$form.find('.desc-content textarea').val())
            });
            this._closeFrom();
            return false;
        },

        _closeFrom: function () {
            this._toggleEditForm(null, false);
            this.$el.removeClass('edited');
        }
    });
});