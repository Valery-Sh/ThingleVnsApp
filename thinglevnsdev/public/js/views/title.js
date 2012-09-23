/** Could we generalize this further to #page-title or thereabouts? */
define(function (require) {
    var html = require('text!tpl/title.html');

    return Backbone.View.extend({
        template:_.template(html),

        render:function () {
            $("#things-title", "#main").remove();
            if (this.options.title) {
                $(this.el).html(this.template({
                    title:this.options.title,
                    subtitle: this.options.subtitle
                }));
            }
        }
    });
});