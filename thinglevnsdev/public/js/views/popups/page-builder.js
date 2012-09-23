define([
    "text!tpl/popups/page-builder.html"
], function(html) {

    return Backbone.View.extend({
        auth : true,
        template : _.template(html),
        events : {
            'click .toggle' : '_toggleCheckbox',
            'click .toggle-all' : '_toggleAllCheckbox',
            'click .back-to-list a' : '_toggleDetails',
            'click .details' : '_toggleDetails',
            'click .save' : '_save',
        },

        initialize : function() {
            this._thing = this.options.thing;
            this._thingView = this.options.thingView;
            this._settings = this._thing.get("settings") || {};
        },

        render : function() {
            var self = this;
            $(self.el).html(self.template({
                settings : self._settings,
                sections : self._sections
            }));
        },

        _sections : {
            map : {
                name : "Map",
                description : "Know where to find your Thingle? " +
                		"Add a map to your Thingle to let others know where you can see it or buy it. " +
                		"You can add multiple locations." +
                		"<br/>Is your Thingle about an event? " +
                		"With the map content section people can find the location where the event is hosted."
            }
        },

        _toggleAllCheckbox : function(e) {
            var self = this;
            var check = e.target.checked;

            $("input", this.$el).each(function() {
                if (this.name) {
                    self._settings[this.name] = check;
                    this.checked = check;
                }
            });
        },

        _toggleCheckbox : function(e) {
            var check = e.target.checked;
            var name = e.target.name;
            this._settings[name] = check;
            $('input[name=' + name + ']', this.$el)[0].checked = check;
        },

        _toggleDetails : function(e) {
            var section = $(e.target).attr("data-section");
            if (section) {
                $('.item-header input', this.$el)[0].name = section;
                $('.item-header input', this.$el)[0].checked = this._settings[section];
                $('.item-header .name', this.$el).html(this._sections[section].name);
                $('.item-content p', this.$el).html(this._sections[section].description);
            }
            $('.builder-list, .builder-item-content', this.$el).toggle();
            return false;
        },

        _save : function() {
            var self = this;
            var data = {
                settings : this._settings
            };
            this._thing.save(data, {
                success : function() {
                    $(self.el).modal("hide");
                    self._thingView.render();
                }
            });
        }
    });

});