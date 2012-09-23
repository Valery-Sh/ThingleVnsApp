define(function () {

    var _fetch = Backbone.Model.prototype.fetch;
    Backbone.Model.prototype.fetch = function(options) {
        var self = this,
            success = options.success;

        options.success = function() {
            self._syncAttributes = {};
            if (success) {
                success.apply(this, arguments);
            }
        };
        if (!options.error) {
            options.error = function() {
                App.router.navigate('404',{trigger:true});
            };
        }

        _fetch.call(this, options);

        return this;
    };



    var _set = Backbone.Model.prototype.set;
    Backbone.Model.prototype.set = function(key, value, options) {
        _set.call(this, key, value, options);

        var attrs;

        if (_.isObject(key) || key == null) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }

        this._syncAttributes = this._syncAttributes || {};
        _.extend(this._syncAttributes, attrs);

        return this;
    };

    Backbone.Model.prototype.method = function(method, type, options) {
        if (typeof type == 'undefined') type = 'read';
        if (typeof options == 'undefined') options = {};

        options.url = options.url || this.url() + '/' + method;
        options.contentType = 'application/json';
        options.data = JSON.stringify(options.data);

        Backbone.sync(type, this, options);
    };

    Backbone.Model.prototype.sync = function(method, model, options) {
        if (method == 'update' && !options.data) {
            options.contentType = 'application/json';
            options.data = JSON.stringify(model._syncAttributes);
        }

        model._syncAttributes = {};

        var self = this,
            success = options.success;

        options.success = function() {
            if (typeof success == 'function') success.apply(this, arguments);
            self._syncAttributes = {};
        };

        return Backbone.sync(method, model, options);
    };

    var Models = {
        Thing: Backbone.Model.extend({
            idAttribute: "_id",
            urlRoot:'/api/things',

            _wallPicture: null,
            _smallPicturesPercent: 0.5,

            initialize: function(){
                /**
                 * centralized workaround for breaking null values
                 */
                if(!this.get('likers')){
                    this.set('likers', []);
                }
            },

            getDate: function() {
                return new Date(this.get('createdAt'));
            },

            getWallPicture: function() {
                if (this._wallPicture != null) return this._wallPicture;

                var size = Math.random() <= this._smallPicturesPercent ? 'small' : 'medium',
                    picture = this.getCoverPicture(size);

                if (size == 'medium' && picture.width != App.Config.get('imageSizeMap').medium.width) {
                    picture = this.getCoverPicture('small')
                }

                this._wallPicture = picture;

                return this._wallPicture;
            },

            getCoverPicture: function(size) {
                var picture = 0,
                    pictures = this.get('pictures');

                if (pictures.length > 1) picture = _.find(this.get('pictures'), function (picture) {
                    return picture.isCover;
                });

                return this.getPicture((picture || 0), size);
            },

            getPicture: function(num, size) {
                var picture = typeof num == 'object' ? num : this.get('pictures')[num];

                if (typeof picture == 'undefined') return {};

                return _.find(picture.sizes, function (variant) {
                    return variant.name == size
                });
            },

            share:function () {
                var self = this;

                App.currentUser.checkAuth(function() {
                    var origin = document.location.protocol + "//"
                        + document.location.host;

                    var obj = {
                        method:'feed',
                        link:origin + '/#!things/' + self.get('_id'),
                        picture:self.getCoverPicture('medium').url,
                        name:self.get('title'),
                        description:self.get('description')
                    };

                    var pagePath = window.location.pathname + window.location.search + window.location.hash;

                    FB.ui(obj, function(response) {
                        if (response && response.post_id) {
                            if (window._gaq) {
                                window._gaq.push([ '_trackSocial', 'facebook', 'share', obj.link, pagePath ]);
                            }

                            console.log("Thingle is shared to Facebook.");

                            self.method('share', 'create');
                        }
                    });
                }, true);

            }
        }),

        Tag: Backbone.Model.extend({
            idAttribute: '_id',
            url: '/api/tags'
        }),

        Comment: Backbone.Model.extend({
            idAttribute: '_id',
            initialize:function (attrs) {
                this.urlRoot = "/api/things/" + attrs.thing + "/comments";
            }
        }),
        
        Deck: Backbone.Model.extend({
            idAttribute: "_id",
            url:'/api/decks',
            initialize:function () {
                //This needs a solution?
                var Things = Backbone.Collection.extend({
                    model:App.Models.Thing,
                    url:'/api/things'
                })
                this.things = new Things;
                this.things.url = "/api/decks/" + this.get('_id') + "/things";
            }
        }),

        Category: Backbone.Model.extend({
            url:'/api/categories'
        }),

        User: Backbone.Model.extend({
            idAttribute: "_id",
            urlRoot:'/api/users',

            follow: function(cb, del) {
                var self = this;
                App.currentUser.checkAuth(function(){
                    if (typeof del == 'undefined') del = false;

                    var type = del ? 'delete' : 'create',
                        url = '/api/users/' + App.currentUser.get('_id') + '/followings';

                    if (del) url += '/' + self.get('_id');

                    self.method('', type, {
                        data: {userId: self.get('_id')},
                        url: url,
                        success: function() {
                            var id = self.get('_id');

                            if (del) {
                                var id_index = App.currentUser.attributes.followings.indexOf(id);
                                App.currentUser.attributes.followings.splice(id_index, 1);
                            } else {
                                App.currentUser.attributes.followings.push(id);
                            }

                            if (typeof cb == 'function') cb.apply(this, arguments);
                        }
                    });
                }, true);
            },

            unfollow: function(cb) {
                this.follow(cb, true);
            }
        }),

        CurrentUser: Backbone.Model.extend({
            urlRoot:'/api/session',
            _authenticated:null,
            //These approaches need to be consolidated.
            /** We need to be able to cater to the situation where we want to run the cb in all cases */
            autoAuth: function(cb, require){
              console.log('autoAuth');
              var self = this;

              var doAuth = function(){
                FB.getLoginStatus(function(fbR){
                  if(fbR.status && fbR.status === "connected"){
                    cb();
                  } else {
                    App.on('fb-authed',cb);
                    App.trigger('fb-login');
                  }
                });
              };
              if( typeof FB == "undefined"){
                App.on('fb-loaded', doAuth)
              } else { doAuth();}

              //return self.checkAuth(cb, require, true);
            },
            checkAuth:function (cb, require, auto) {
                var self = this;
                if (self._authenticated === null) {
                    return self._checkAuthRemote(cb, require, auto);
                }

                if (this._authenticated) {
                    if (typeof cb == 'function') cb();
                    App.trigger('authorized');
                }
                else {
                    if (typeof cb == 'function'){ App.on('auth', cb);}
                    //if (auto){App.trigger('fb-login');}
                    if (require){ App.trigger('unauthorized');}
                }
            },
            _checkAuthRemote:function (cb, require, auto) {
                var self = this;
                self.fetch({
                    // We need to double check this against
                    // FB.getLoginStatus
                    success:function () {
                        self._authenticated = true;
                        self.id = 'default';
                        if (typeof cb == 'function') cb();
                        App.trigger('authorized');
                    },
                    error:function (model, response) {
                        if (response.status == 401) self._authenticated = false;
                        if (typeof cb == 'function') App.on('auth', cb);
                        if (require) App.trigger('unauthorized');
                        //if (auto){App.trigger('fb-login');}
                    }
                });
            },
            authenticate:function (accessToken, cb) {
                if (!accessToken) {
                    if (typeof cb == 'function') cb();
                    return;
                };
                
                var self = this;
                self.set('access_token', accessToken);
                
                self.save({}, {
                    success:function () {
                        self._authenticated = true;
                        self.id = 'default';
                        console.log('user authed');
                        App.trigger('auth');
                        if (typeof cb == 'function') cb();
                    },
                    error:function (model, response) {
                        if (response.status == 401) self._authenticated = false;
                        App.trigger('auth-failed');
                        if (typeof cb == 'function') cb();
                    }
                })
            },

            login:function () {
                var self = this;
                App.trigger('login');
            },
            
            logout: function(cb) {
                var self = this;
                self.destroy({
                    success:function () {
                        self._authenticated = false;
                        self.id = null;
                        if (typeof cb == 'function') cb();
                    }
                });
            }
        }),

        Notification: Backbone.Model.extend({
            idAttribute: "_id",
            urlRoot:'/api/profile/notifications'
        })
    };

    var Collections = {
        Things: Backbone.Collection.extend({
            model: Models.Thing,
            url:'/api/things'
        }),

        Comments: Backbone.Collection.extend({
            model: Models.Comment,
            initialize: function (thingId) {
                this.url = "/api/things/" + thingId + "/comments";
            }
        }),
        
        Decks: Backbone.Collection.extend({
            model: Models.Deck,
            url:'/api/decks'
        }),

        Users: Backbone.Collection.extend({
            model: Models.User,
            url:'/api/users'
        }),

        Notifications: Backbone.Collection.extend({
            model: Models.Notification,
            url:'/api/profile/notifications'
        })
    };

    return {
        Models: Models,
        Collections: Collections
    };
});
