define(function (require) {
    var html = require('text!tpl/popups/welcome.html');

    return Backbone.View.extend({
        template:_.template(html),
        events:{
            "click a": "_closePopup"
        },

        initialize:function () {
            var self = this;
            $('.modal-backdrop').live('click',function(){
                self._closePopup();
            });
        },

        render:function () {
            $(this.el).html(this.template({}));
        },

        _closePopup: function () {
            $(this.el).modal("hide");
            $(this.el).remove();
        }

    });
});
