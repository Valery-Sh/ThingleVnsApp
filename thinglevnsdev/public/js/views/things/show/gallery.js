define(function(require) {
    var html = require('text!tpl/things/show/gallery.html');

    require('lib/jquery.mousewheel');

    return Backbone.View.extend({
        id: 'carousel',
        template: _.template(html),
        events: {
            'click a.add': '_repost',
            'click .tools-panel .share': '_share',
            'click .tools-panel .like': '_toggleLike',
            "dragstart .item": "_dragStart",
            "dragend .item": "_dragEnd"
        },
        navigation: "Gallery",

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this._parent = this.options.parent;
            this._thing = this.options.thing;
        },

        render: function() {
            var self = this,
                html = this.template({
                thing: this._thing
            });
            this.$el.html(html);
            App.currentUser.checkAuth(function() {
                var likers = self._thing.get("likers");
                if (likers && likers.indexOf(App.currentUser.get("_id")) >= 0) {
                    $(".tools-panel .like", self.$el).addClass("selected");
                }
            });
            this._initGallery();
        },

        _initGallery: function() {
            var $gallery = this.$('.thingle-scrollable'),
                $position = this.$('.scrollable-position'),
                selectedItemIndex = 1;
            $gallery.scrollable({
                speed: 250,
                keyboard: false,
                onBeforeSeek: function(){
                    this.getItems().removeClass('active');
                },
                onSeek: function(){
                    $position.children('.current').text(this.getIndex()+1);
                }
            });
            var api = $gallery.data("scrollable");
            $position.children('.total').text(api.getSize());
            $('.next, .prev',$gallery).click(function(){
                api.getItems().eq(api.getIndex()).addClass('active');
            });
            $(".item:first", $gallery).addClass("active");

            // var $content = $('#content'),
            //     scroll_step = 50;

            // $('.scrollable-outer').mousewheel(function(event, delta){
            //                             $content.scrollTop($content.scrollTop() - (delta*scroll_step));
            //                       });

            this._checkLongImages($gallery);
//            if (api.getSize() > selectedItemIndex) {
//                api.seekTo(selectedItemIndex);
//                api.getItems().eq(selectedItemIndex).addClass('active');
//            }
        },

        _checkLongImages: function($gallery) {

            var long_image_percent = 20,
                item_height = 403,
                item_width = 502;

            var $items = $gallery.find('.item'),
                items_count = $items.size();

            var img_count = 0;

            $items.each(function(index){
                var $item = $(this),
                    height_with_percent = item_height+(item_height*long_image_percent/100);


                $item.find('img').one("load", function () {
                    var $img = $(this),
                        img_height = $img.height();


                    if (img_height > height_with_percent) {
                        $img.removeAttr('height').attr('height',item_height);

                    } else if ((img_height <= height_with_percent) && (img_height > item_height)) {
                        $img.css({
                            'margin-top': -1 * Math.ceil((img_height-item_height)/2)
                        })
                    }

                    var img_width = $img.width();

                    if (img_width < item_width) {
                        img_width = img_width > 220 ? img_width : 220;
                        var margin = Math.ceil((item_width - img_width) / 2);

                        $item.css({
                            'margin-left': margin,
                            'margin-right': margin+18
                        })
                    }

                    $img.fadeTo("fast",1,function(){
                        $item.removeClass('preloader');
                    });

                    img_count++;

                    if (img_count == items_count) {
                        $('.scrollable-outer').addClass('fixed');

                        $('.details-content').css({
                            'margin-top': $gallery.outerHeight() + 77
                        })

                        // setTimeout(function(){
                        //     var scroll_width = $('#content').width() - $('#main').width();
                        //     $('.scrollable-outer, .details-title').css('right',scroll_width);
                        // },100);

                        var api = $gallery.data("scrollable");
                        var selectedItemIndex = 1;
                        if (api.getSize() > selectedItemIndex) {
                            api.seekTo(selectedItemIndex);
                            api.getItems().eq(selectedItemIndex).addClass('active');
                        }
                    }
                }).each(function(){
                    if (this.complete) $(this).load();
                })
            });
        },

        _share: function (event) {
            var target = $(event.target);
            var item = target.parents(".item");
            var origin = document.location.protocol + "//"
            + document.location.host;
            var pagePath = window.location.pathname + window.location.search + window.location.hash;

            var obj = {
                    method: 'feed',
                    link: origin + '/#things/' + item.data('id'),
                    picture: target.data('img'),
                    name: target.data('name'),
                    description: target.data('description')
            };

            FB.ui(obj, function(response) {
                if (response && response.post_id) {
                    if (window._gaq) {
                        window._gaq.push([ '_trackSocial', 'facebook', 'share', obj.link, pagePath ]);
                    }
                }
            });

            return false;
        },

        _toggleLike: function (e) {
            var self = this,
                like = $(".tools-panel .like", self.$el),
                doUnlike = like.hasClass('selected'),
                thingId = self._thing.get('_id'),
                verb = like.hasClass('selected') ? 'DELETE' : 'POST';
            var action = function() {
                $.ajax({
                    type: verb,
                    url:"/api/things/" + thingId + "/likes",
                    success: function() {
                        var likers = self._thing.get("likers") || [];
                        if (doUnlike) {
                            var index = likers.indexOf(App.currentUser.get("_id"));
                            if (index >= 0) {
                                likers.splice(index, 1);
                                self._thing.set("likers", likers);
                            }
                            like.removeClass('selected');
                        } else {
                            if (likers.indexOf(App.currentUser.get("_id")) < 0) {
                                likers.push(App.currentUser.get("_id"));
                                self._thing.set("likers", likers);
                            }
                            like.addClass('selected');
                        }
                        App.trigger('onLikeSuccess', {thingId: thingId});
                    }
                });
            };
            App.currentUser.checkAuth(action, true);
        },

        /** More Duplication from things-list */
        _repost:function (event) {
            App.popup('repost', {thingId:$(event.target).parents(".item").data("id")});

            return false;
        },

        _dragStart:function (evt) {
            var $draggedThing = $(evt.target);
            if (!$draggedThing.hasClass('item')) {
                $draggedThing = $draggedThing.parents('.item');
            }
            var dt = evt.originalEvent.dataTransfer;
            dt.setData("text/plain", $draggedThing.data('id'));
            /** MDN docs insist that elements don't need to be in the document
             *  But Chrome seems to disagree.
             */
            var $proxy = $('#dragproxy').html(
                $('<div class="thing-drag-proxy"><img src="'+
                    $draggedThing.find('img').attr('src')+'"></div>')
            ).removeClass('hide');

            dt.setDragImage($proxy.get(0), 100, 100);
            // There is a delay from the setDragImage call to that image is rendered
            window.setTimeout(function () {
                $proxy.addClass('hide');
            }, 200);

            //Set class on Body to show that a Thing is being dragged
            $('body').addClass('dragging-thing');
        },

        _dragEnd:function (evt) {
            //Set class on Body to show that a Thing is not being dragged
            $('body').removeClass('dragging-thing');
        }
    });
});