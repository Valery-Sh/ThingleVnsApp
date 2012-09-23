define(function (require) {
    require('lib/jquery.mousewheel');
    require('lib/bootstrap/bootstrap-dropdown');
    var html = require('text!tpl/mingle/fb_friends.html'),
        user_html = require('text!tpl/mingle/user_item.html'),
        titleView = new (require('views/title')),
        appUrl = window.location.protocol + "//" + (window.location.host.match('localhost') ? "thingle.com" : window.location.host);


    return Backbone.View.extend({
        template:_.template(html),
        user_tmpl:_.template(user_html),
        inviteCfg:{
            description:_.template('<%= u.get("firstName") %> invited you to Thingle, a place to create, discover, organize and share your favorite things.'),
            //Can't currently prepopulate the message form
            //We could get that if we are sending via the backend, but then we will need to request those permissions first.
            //personableMsg: 'Hey! Come explore this Thingle thingie with me :)',
            link:_.template(appUrl),
            name:"Thingle - Be Passionate.",
            picture:appUrl + "/images/thingle-fb-icon_3.png"
        },
        listDeco:{
            app_user:{
                btnClass:" btn-primary not_followed",
                btnTxt:"Follow!"
            },
            following:{
                btnClass:"btn-primary followed",
                btnTxt:"Unfollow"
            },
            not_user:{
                btnClass:" btn-primary invite ",
                btnTxt:"Add to invite list"
            },
            inviting:{
                btnClass:"btn-primary uninvite",
                btnTxt:"Remove from invite list"
            },
            invited:{
                btnClass:"btn-primary noop",
                btnTxt:"Invite Sent!"
            }
        },

        invite_title:'Invite Friends',
        already_invited:[],
        appUsers:[],
        /**
         * The main method used to invite FB friends.
         * Used to map to method calls on this object.
         * @property {String} fbInvite_method
         */
        fbInvite_method:"apprequest",
        events:{
            'click li.user .invite':'invite',
            'click li.user .uninvite':'uninvite',
            'click li.user[data-u_id] .not_followed':'follow',
            'click li.user[data-u_id] .followed':'unfollow',
            'click .send_invites':'send_fb_invites',
            'click .send_invites_and_message':'send_fb_invites_and_message',
            'click .btn.alert-sucess':'close_success_alert',
            'keyup .typefilter':'responsiveFilter'
        },

        initialize:function () {
            this.parentView = this.options.parentView;
            this.parentView.viewStack.push(this);
        },

        delegateEvents:function () {
            var self = this;
            Backbone.View.prototype.delegateEvents.apply(this, arguments);

            $(window).bind('resize.userList', function () {
                self._reinitScrollPanels()
            });
        },
        undelegateEvents:function () {
            Backbone.View.prototype.undelegateEvents.apply(this, arguments);

            $(window).unbind('resize.main');
            return this;
        },

        _reinitScrollPanels:function () {
            var wh = $(window).height(), botMargin = 20,
                hMax = wh - botMargin;

            this.$el.find('.scroll-pane').each(function () {
                var pane = $(this), jsp = pane.data('jsp');

                pane.height(hMax - pane.offset().top);
                if (jsp) {
                    jsp.reinitialise();
                } else {
                    pane.jScrollPane();
                }
            });
        },
        render:function () {
            var self = this;
            App.inviteView = self;

            titleView.render(self.invite_title);
            $(self.el).html(self.template());

            // FIXME: Should have a "proper" Mingle API set
            $.get('/api/users/' + App.currentUser.get('_id') + '/followings',
                function (follows) {
                    self.appUsers = self.appUsers.concat(follows);
                    var appUsers_fbids = _.map(self.appUsers, function (f) {
                        return "" + f.fbId;
                    });
                    self.fbGetUsers(appUsers_fbids);
                });

        },

        render_users:function (users) {
            var self = this;
            var userList = _.map(_.sortBy(
                users, function (u) {
                    return u.name;
                }), function (u) {
                return self.user_tmpl({
                    deco:self.listDeco,
                    user:u
                });
            });

            $(self.el).find('ul.friends.list').html(userList.join(''));
            self._reinitScrollPanels();

            _.each(self.already_invited, function (fbid) {
                $('.friends.list li[data-fbid=' + fbid + ']').find('.btn').text("Sent!").addClass("btn-info");
            });
        },
        massageUsers:function (users) {
            var self = this,
                cuFolls = App.currentUser.get('followings'),
                fbIds = _.pluck(users, 'uid');

            $.ajax({
                url:'/api/profile/friends',
                data:{fbids:fbIds},
                success:function (appFriends) {
                    self.appUsers = appFriends.concat(self.appUsers);
                },
                complete:function () {
                    _.each(users, function (u) {
                        u.fbid = u.uid;
                        u.state = u.is_app_user ? "app_user" : "not_user";
                        _.extend(u, _.find(self.appUsers, function (au) {
                            if (au.fbId == u.fbid) {
                                u.state = cuFolls.indexOf(au._id) != -1 ? "following" : "app_user";
                                return true;
                            }
                        }));

                        /** already invited but not yet accepted */
                        //TODO
                    });
                    self.users = users;
                    self.render_users(users);
                }
            });
        },

        getUserFromDom:function (domElement) {
            var el = $(domElement),
                self = this,
                uids = {
                    fbid:el.data('fbid'),
                    _id:el.data('u_id') || null
                },
                user = _.find(self.users, function (u) {
                    return (uids.fbid == u.fbid || (uids._id && uids._id == u._id));
                });
            return user;
        },

        renderUserEl:function (user) {
            var self = this,
                out = self.user_tmpl({
                    deco:self.listDeco,
                    user:user
                });
            return out;
        },

        navToProfile:function (evt) {
            var li = $(evt.target).parents('li'), self = this,
                user = this.getUserFromDom(li);
            App.router.navigate('users/' + user._id, {trigger:true});
        },

        /**
         * Handler for adding a friend to the current invitation list
         */
        invite:function (evt) {
            var li = $(evt.target).parents('li'),
                self = this,
                user = self.getUserFromDom(li),
                btnGrp = $('.act_on_selected');
            user.state = "inviting";

            li.replaceWith(self.renderUserEl(user));
            btnGrp.removeClass('hide');
        },
        /**
         * Handler for removing a friend from the current invitation list
         */
        uninvite:function (evt) {
            var li = $(evt.target).parents('li'),
                self = this,
                user = self.getUserFromDom(li),
                btnGrp = $('.act_on_selected');
            user.state = "not_user"; // educated guess
            li.replaceWith(self.renderUserEl(user));

            if (!li.parents('ul').find('li.user .remove_invite').size()) {
                btnGrp.addClass('hide');
            }
        },

        follow:function (evt) {
            var li = $(evt.target).parents('li'),
                self = this,
                user = self.getUserFromDom(li),
                userM = new App.Models.User({
                    _id:user._id
                });

            userM.follow(function () {
                user.state = "following";
                li.replaceWith(self.renderUserEl(user));
            });
        },

        unfollow:function (evt) {
            var li = $(evt.target).parents('li'),
                self = this,
                user = self.getUserFromDom(li),
                userM = new App.Models.User({
                    _id:user._id
                });

            userM.unfollow(function () {
                user.state = "app_user";
                li.replaceWith(self.renderUserEl(user));
            });
        },

        invite_success:function (evt) {
            var self = this, li, user, btnGrp = $('.act_on_selected').addClass('hide'),
                notice = $('<span onclick="$(this).remove();" class="btn alert-success">Invitations Sent!</span>');

            btnGrp.after(notice);
            notice.fadeOut(4000, function () {
                /*This should happen,
                 but fadeOut and css transitions don't play nice,
                 and makes it look abrupt
                 $(this).remove();*/
            });
            $('li.user .uninvite').each(function (i, ubtn) {
                //Obviously we should be saving this state as well.
                li = $(ubtn).parents('li');
                user = self.getUserFromDom(li);
                user.state = "invited";
                li.replaceWith(self.renderUserEl(user));
            });
        },

        fbGetUsers:function (addUsers) {
            console.log(addUsers);
            var self = this,
                fbq = encodeURIComponent('/fql&q=SELECT uid, name, is_app_user, pic_square FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1 = me())');

            if (addUsers && addUsers.length) {
                fbq += encodeURIComponent(' OR uid IN (' + addUsers.join(',') + ') ');
            }

            self.fb_helper(function () {
                FB.api(fbq, {access_token:FB.getAccessToken()}, function (response) {
                    //console.log(response);
                    self.massageUsers(response.data);
                });
            });
        },

        send_fb_invites_and_message:function (evt) {
            this.send_fb_invites(evt, true);
            return false;
        },

        send_fb_invites:function (evt, sendMessage) {
            var self = this,
                sendUIDs = _.map($('.list > li.user .uninvite'), function (item) {
                    return $(item).parents('li.user').attr('data-fbid');
                });
            self['send_fb_invites_via_' + self.fbInvite_method](sendUIDs, sendMessage);
        },

        send_fb_invites_via_apprequest:function (sendUIDs, sendMessage) {
            var self = this;
            FB.ui(
                _.defaults({
                    method:'apprequests',
                    access_token:FB.getAccessToken(),
                    to:sendUIDs.join(','),
                    message:self.inviteCfg.description({u:App.currentUser}),
                    data:JSON.stringify({type:'invite', from:App.currentUser.get('_id')})
                }, {}), function (response) {
                    console.log(response);
                    if (response.success || response.request) {
                        self.invite_success();
                        if (sendMessage) {
                            self.send_fb_invites_via_message(sendUIDs);
                        }
                    }

                    /**
                     * The code below is only really applicable to
                     * App Request based invites. But we should probably log stats
                     * just the same.
                     */
                    if (response.request) {
                        $.ajax({
                            type:'POST',
                            url:"/api/users/" + App.currentUser.get('_id') + "/fbinvites",
                            data:{
                                fbResp:response
                            },
                            dataType:"json",
                            success:function (resp) {
                                console.log('Invitations saved');
                                console.log(resp);
                            }
                        });
                    }
                });
        },

        send_fb_invites_via_message:function (sendUIDs) {
            var self = this;
            FB.ui(
                _.defaults({
                    method:'send',
                    access_token:FB.getAccessToken(),
                    to:sendUIDs.join(','),
                    link:self.inviteCfg.link({
                        u:App.currentUser
                    })
                    // It seems that we might not be able to prepopulate the message via this interface
                    //,description: self.inviteCfg.personableMsg

                }, self.inviteCfg), function (response) {
                    console.log(response);
                    if (response.success) {
                        console.log('Message Sent');
                        self.invite_success();
                    }

                    /**
                     * The code below is only really applicable to
                     * App Request based invites. But we should probably log stats
                     * just the same.
                     */
                    if (response.request) {

                        $.ajax({
                            type:'POST',
                            url:"/api/users/" + App.currentUser.get('_id') + "/fbinvites",
                            data:{
                                fbResp:response
                            },
                            dataType:"json",
                            success:function (resp) {
                                console.log('Invitations saved');
                                console.log(resp);
                            }
                        });
                    }
                });
        },

        /**
         * Utilizes the standard FB.ui multiselector
         */
        fbUI_invite:function () {
            var self = this,
                fb_invite = function () {
                    FB.ui({
                        method:'apprequests',
                        message:self.inviteCfg.description({
                            u:App.currentUser
                        }),
                        title:self.inviteCfg.name
                    }, function (response) {
                        console.log(response);
                    });
                };

        },
        /**
         * Facebook JS API wrapper to deal with async loading
         * Still needs to be made more robust.
         */
        fb_helper:function (cb) {
            if (typeof FB == 'undefined') {
                App.on('fb-loaded', function () {
                    console.log('triggered on fb-loaded');
                    App.on('fb-authed', function () {
                        console.log('triggered on fb-authed');
                        cb();
                    });
                });
            } else {
                cb();
            }
        },

        /**
         * Responsive Filter as you type
         */

        responsiveFilter:function (evt) {
            var input = $(evt.target),
                query = input.val().toLowerCase(),
                srcSet = $(input.data('src_sel'));

            srcSet.each(function () {
                var t = $(this), c = t.parents('li.user');
                if (t.text().toLowerCase().match(query)) {
                    c.removeClass('hide');
                } else {
                    c.addClass('hide');
                }
            });

            this._reinitScrollPanels();
        },

        /**
         * small ui helper for a highlight effect
         * quick and dirty for testing
         */
        highlight:function (el) {
            el.css('background-color', "#63A2D5");
            el.animate({
                opacity:0
            }, 1000, function () {
                el.removeAttr('style');
            });

        },
        close_success_alert:function (evt) {
            $(evt.target).remove();
        }
    });
});