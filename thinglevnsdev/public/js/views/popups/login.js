define(function (require) {
    var html = require('text!tpl/popups/login.html');

    return Backbone.View.extend({
        template:_.template(html),
        events:{
            'click .fb-login':'fb_login'
        },

        initialize:function () {
            var self = this;

            App.on('auth auth-failed', function () {
                $(self.el).modal('hide');
            });

            /*$('#login-popup').on('hidden', function() {
             App.off('auth');
             });*/
        },

        render:function () {
            $(this.el).removeClass('thingle-modal').html(this.template({}));
        },


        fb_login:function () {
            App.trigger('fb-login');
        }
    });
});
