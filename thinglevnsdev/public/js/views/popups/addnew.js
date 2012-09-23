define(function (require) {
    var html = require('text!tpl/popups/addnew.html');

    return Backbone.View.extend({
        auth:true,
        template:_.template(html),
        events:{
        },

        initialize:function () {
        },

        render:function () {
            $(this.el).html(this.template({}));
        }

    });
});
