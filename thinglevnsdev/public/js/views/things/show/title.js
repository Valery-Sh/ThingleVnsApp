define(function(require) {
    var html = require('text!tpl/things/show/title.html');

    return Backbone.View.extend({
        id: 'title',
        template: _.template(html),
        events: {
            'submit form': '_onFormSubmit'
        },

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this.$el.on("edit", $.proxy(this._toggleEditForm, this));
            this._parent = this.options.parent;
            this._thing = this.options.thing;
        },

        render: function() {
            this.$el.html(this.template({
                thing: this._thing
            }));
            this.$form = $('form', this.$el);
            this.form = this.$form[0];
        },

        _toggleEditForm: function(e, editable) {
            if (editable) {
                this.$form.html(
                    '<div class="control-group">'+
                    '<div class="input-append">'+
                    '<input name="title" type="text" value="'+ this._thing.get('title') + '">' +
                    '<button class="btn btn-primary" type="submit">3</button>'+
                    '</div>'+
                    '</div>'
                );
                this.$form.find('input[type=text]').focus();
            } else {
                this.$form.html('<span>' + this._thing.get('title') + '</span>');
            }
        },

        _onFormSubmit: function () {
            this._parent.updateThingle({
                title: $("[name='title']", this.$form).val()
            });
            this._toggleEditForm(null, false);
            this.$el.removeClass("edited");
            return false;
        }
    });
});