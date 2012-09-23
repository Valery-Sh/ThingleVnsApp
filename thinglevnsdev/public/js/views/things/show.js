define(function(require) {
    var html = require('text!tpl/things/show.html'),
        TitleBlock = require('views/things/show/title'),
        GalleryBlock = require('views/things/show/gallery'),
        CommentsBlock = require('views/things/show/comments'),
        DescriptionBlock = require('views/things/show/description'),
        TagsBlock = require('views/things/show/tags'),
        EditorsBlock = require('views/things/show/editors'),
        CollectorsBlock = require('views/things/show/collectors'),
        LikersBlock = require('views/things/show/likers'),
        MapBlock = require('views/things/show/map');

    require('lib/jquery.tools.min');

    return Backbone.View.extend({
        id: 'thingle-details',
        template: _.template(html),
        events: {
            'click .details-nav .pages-settings > a': '_openPageBuilder',
            'click .details-nav .add-page > a': '_openThinglePopup',
            'click .details-nav li > a': '_navigate',
            'click .btn-follow': '_follow',
            'click .btn-unfollow': '_unfollow',
            'click .details-edit': '_toggleEditForm'
        },

        initialize: function() {
            App.on('afterRepost', this._onRepost, this);
            this._thing = new App.Models.Thing({_id: (this.options.thingId || this.options[0])});
            $('.details-editable', this.$el).on('edit', $.proxy(this._toggleEditForm, this));
        },

        render: function() {
            var self = this;

            this._thing.fetch({
                success: function(thing) {
                    var user = self._user = new App.Models.User(thing.get('createdUser')),
                        deck = self._deck =  new App.Models.Deck(thing.get('createdDeck')),
                        data = {
                            thing: thing,
                            deck: deck,
                            user: user
                        };
                    $(self.el).html(self.template(data));
                    self.$('.scrollable .item:first').addClass('active');
                    self._switchProfileBtn();

                    self._renderDetailsBlock(TitleBlock);
                    self._renderDetailsBlock(GalleryBlock);
                    self._renderDetailsBlock(DescriptionBlock);
                    if (thing.get("settings") && thing.get("settings").map) self._renderDetailsBlock(MapBlock);
                    self._renderDetailsBlock(CommentsBlock);
                    self._renderDetailsBlock(CollectorsBlock);
                    self._renderDetailsBlock(LikersBlock);
                    self._renderDetailsBlock(TagsBlock);
                    self._renderDetailsBlock(EditorsBlock);                    
                    self._renderDetailsScroll();
                    
                    $(".details-nav ul").append('<li class="pages-settings"><a href="#">x</a></li>');
                    
                    App.trigger("meta:change", {
                        title : thing.get("title"),
                        description : thing.get("description"),
                        keywords : thing.get("tags")
                    });
                }
            });
        },

        updateThingle: function (data) {
            var self = this;
            if (data) {
                for(var key in data) {
                    this._thing.set(key, data[key]);
                }
            }
            this._thing.save(null, {
                success: function () {
                    self.trigger("saveThingle");
//                    self._renderDetailsBlock(EditorsBlock);
                }
            });
        },

        _renderDetailsScroll: function() {
            var onScrollPosition = this.options.modal ? 'absolute' : 'fixed',
                onScrollTop = this.options.modal ? function(self) {return self.scrollTop-1} : $('header').outerHeight()-1,
                onScrollTarget = this.options.modal || window;

            var $gallery = $('.scrollable-outer'),
                $title = $('.details-title');

            $(onScrollTarget).scroll(function(){
                var self = $(this),
                    topLimit = $gallery.outerHeight(),
                    $nav = $('.details-nav');

                if (self.scrollTop() >= topLimit) {
                    // var title_right = $('#title').css('right');
                    $nav.css({
                        'position': onScrollPosition,
                        'right': ($('#shelf').hasClass('opened') ? 221 : 0),
                        'top': $title.outerHeight() + (typeof onScrollTop == "function" ? onScrollTop(this) : onScrollTop)
                    });
                } else {
                    $nav.css({
                        'position': 'absolute',
                        'right': 0, 'top': 0
                    });
                }

                $title.css({
                    'top': typeof onScrollTop == "function" ? onScrollTop(this) : onScrollTop
                });

                $gallery.css({
                    'top': $title.outerHeight()+(typeof onScrollTop == "function" ? onScrollTop(this) : onScrollTop)
                });

            });
        },

        _renderDetailsBlock: function(Block) {
            var block = new Block({
                parent: this,
                thing: this._thing
            });
            if (block.navigation) {
                this._putLinkToNav(block.navigation, block.id);
            }
            block.render();
        },

        _onRepost: function (options) {
            if (options.thingle_id == this._thing.get("_id")) {
                var self = this;
                this._thing.fetch({
                    success: function() {
                        self._renderDetailsBlock(TagsBlock);
                    }
                });
            }
        },

        _putLinkToNav: function(title, id) {
            if ($(".details-nav li a[target='#" + id + "']").length == 0) {
                $(".details-nav ul").append("<li><a target='#" + id + "'>" + title + "</a></li>");
            }
            if ($(".details-nav li.active").length == 0) {
                $(".details-nav li:first").addClass("active");
            }
        },

        _switchProfileBtn: function()  {
            var self = this,
                $follow = self.$('.btn-follow'),
                $unfollow = self.$('.btn-unfollow'),
                $editProfile = self.$('.btn-editprofile');

            $editProfile.hide();
            $unfollow.hide();

            App.currentUser.checkAuth(function() {
                $follow.hide();

                if (self._user.get('_id') == App.currentUser.get('_id')) return $editProfile.show();
                if (App.currentUser.get('followings').indexOf(self._user.get('_id')) == -1) return $follow.show();
                $unfollow.show();
            });
        },

        _navigate: function (e) {
            var $body = $(this.options.modal || 'body'),
                $nav = $('.details-nav'),
                $title = $('.details-title'),
                $gallery = $('#carousel'),
                id = $(e.target).prop('target');

            if (id == '#carousel') {
                id_top = 0
            } else {
                id_top = $(id).position().top + $gallery.outerHeight() + 20; // 20px - part of section title margin-bottom
            };

            $('.details-nav li').removeClass('active');
            $(e.target).parent().addClass('active')
            $body.animate({scrollTop: id_top},"normal");
        },

        _follow: function() {
            var self = this;
            this._user.follow(function() {
                self._switchProfileBtn();
            });
        },

        _unfollow: function() {
            var self = this;
            this._user.unfollow(function() {
                self._switchProfileBtn();
            });
        },

        _toggleEditForm: function (e) {
            var execute = function() {
                var block = $(e.target).parents('.details-editable');
                block.trigger("edit", [!block.hasClass('edited')]); // class not toggled yet
                block.toggleClass('edited');
            };
            App.currentUser.checkAuth(execute, true);
        },
        
        _openPageBuilder: function (event) {
            App.popup('page-builder', {thing: this._thing, thingView : this});
            return false;
        },

        _openThinglePopup: function() {
            var self = this;
            App.popup('thingles/new-popup-2', {
                thingle: this._thing,
                onSubmit: function () {
                    self.render();
                }
            });
        }
    });
});