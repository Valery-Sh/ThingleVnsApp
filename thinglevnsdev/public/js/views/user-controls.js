define(function (require) {
    var html = require('text!tpl/user-controls.html');

    return Backbone.View.extend({
        template:_.template(html),
        events:{
            // 'mouseenter .profile.logged': function(e) {App.Helpers.layoutHelper.showSubnav(e.target, '.profile-subnav')},
            // 'mouseleave .profile': App.Helpers.layoutHelper.closeSubnav,
            'click .logout': '_logout'
        },

        initialize:function () {
        },

        _logout:function(e) {
            App.currentUser.logout(function() {
                // redirect to home.
                // reload the page so any state is cleared
                window.location = '/';
            });
            return false;
        },
        
        render:function () {
            $(this.el).html(this.template({}));

            var self = this;
            $('.profile>a', self.el).html('Login');
            App.currentUser.checkAuth(function () {
                $('.profile>a', self.el)
                    .css('background-image', 'url(' + App.currentUser.get('picture').medium + ')')
                    .attr('href', '#profile').removeAttr('data-toggle')
                    .parent().addClass('logged');
            });
        }
    });
});