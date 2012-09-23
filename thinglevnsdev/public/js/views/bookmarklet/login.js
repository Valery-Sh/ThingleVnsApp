define(function (require) {

    var html = require('text!tpl/bookmarklet/login.html');

    return Backbone.View.extend({
        template:_.template(html),
        events:{
            'click a.login':'fb_login'
        },


        fb_login:function () {
            App.trigger('fb-login');
        },

        initialize:function () {
        },

        render:function () {
            var self = this;

            App.on('unauthorized', function () {
                $(self.el).html(self.template({}));
            });

            App.on('auth', function () {
                $(self.el).empty();
            });

            App.on('auth-failed', function () {
                $(self.el).html('Authentication failed');
            });

            $(self.el).html(self.template());
        }
    });
});
