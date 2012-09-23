define(function (require) {
    var html = require('text!tpl/auth.html');

    var view = Backbone.View.extend({

        el:'#auth',
        template:_.template(html),


        login:function () {
            var self = this,
                login = function () {
                    FB.login(function (response) {
                        App.currentUser.authenticate(response.authResponse.accessToken);
                    }, {scope: "publish_stream,email"});
                };

            if (typeof FB == 'undefined') App.on('fb-loaded', login);
            else login();
        },


        initialize:function () {
            App.on('fb-login', this.login);
        },

        render:function () {
            $(this.el).html(this.template({
                fb_app_id:App.Config.get('fbId'),
                channel_file:App.Helpers.staticURL('channel.html')
            }));
        }

    });


    return view;
});
