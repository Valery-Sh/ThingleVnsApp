define(function (require) {
    var templateHtml = require('text!tpl/things/things-list.html'),
        preloaderHtml = require('text!tpl/things/preloader.html'),
        Things = Backbone.Collection.extend({
            model:App.Models.Thing,
            url:'/api/things',
            initialize:function (url) {
                this.url = url || this.url;
            }
        }),
        limit = 40;

    require('lib/css3.transitions.test');
    require('lib/jquery.masonry.min');
    require('lib/jquery.lazyload.min');

    return Backbone.View.extend({
        id: 'things-list',
        $preloader: $(preloaderHtml),
        template: _.template(templateHtml),
        events: {
            "dragstart .item": "dragStart",
            "dragend .item": "dragEnd",
            "click .like": "toggleLike",
            "click .item .tools-panel .add": "_repost",
            "click .item .tools-panel .edit": "_remove",
            "click .item .tools-panel .share": "_share"
        },

        initialize: function () {
            this.title = this.options.title;
            this.category = this.options.category;

            this._things = new Things(this.options.url);
            this._offset = 0;
            this._allLoaded = false;
            this._fromDateTime = new Date();

        },

        delegateEvents: function() {
            var self = this;
            Backbone.View.prototype.delegateEvents.apply(this, arguments);

            $(window).bind('resize.thingsList', function(){
                self.initMasonry();
            });

            $('section#main .masonry').masonry('reload');

            this._initScroll();
        },

        undelegateEvents: function() {
            Backbone.View.prototype.undelegateEvents.apply(this, arguments);

            $(window).unbind("scroll.thingsList");
            $(window).unbind('resize.thingsList');
            return this;
        },

        _initScroll: function () {
            var self = this;
            $(window).bind("scroll.thingsList", function () {
                if (self._loadStarted) return;

                if ($(this).scrollTop() < $('body').height() - $(this).height() - 500) {
                    self._appending = false;
                    return;
                }

                if (self._appending) return;

                self._appending = true;
                self._loadThings();
            });
        },

        render: function () {
            this._allLoaded = false;
            this._loadStarted = false;
            this._loadThings();
        },

        _loadThings: function () {
            var self = this;
            if (!(self._loadStarted || self._allLoaded)) {
                self._loadStarted = true;
                self._showPreloader();
                self._xhr = self._things.fetch({
                    data:{
                        from: self._fromDateTime.getTime(),
                        limit:limit,
                        offset:self._offset
                    },
                    success:function (collection) {
                        self._loadStarted = false;
                        self._offset += limit;
                        self._hidePreloader();
                        if (collection.models.length > 0) {
                            self._pushThings(collection.models);
                        } else {
                            self._allLoaded = true;
                        }
                    }
                });
            }
        },

        _pushThings: function (models) {
            var things = $(this.template({
                rows:models,
                showDeleteButton: this.options.showDeleteButton
            }));
            $(this.el).append(things).masonry('appended', things, true);
            this.initMasonry();
            this.$("img.lazy").lazyload({
                effect : "fadeIn",
                container: window
            })
                .removeClass('lazy')
                .on('appear', function(){
                    var img = this;
                    setTimeout(function(){
                        $(img).parents('figure.item').removeClass('preloader');
                    }, 1500);
                });

        },

        initMasonry: function () {
            var things_list = $(this.el);
            if (!things_list.hasClass('masonry')) {
                things_list.masonry({
                    isAnimated:!Modernizr.csstransitions,
                    columnWidth:20
                });
            } else {
                things_list.masonry('reload') ;
            }
        },

        _repost: function (event) {
            App.popup('repost', {thingId:$(event.target).parents(".item").data("id")});
            return false;
        },

        _remove: function (event) {
            var item = $(event.target).parents(".item");
            item.remove();
            this.initMasonry();
            $(this.el).trigger("onItemRemove", item.data('id'));
            delete item;
            return false;
        },
        
        _share: function (event) {
            var target = $(event.target);
            var item = target.parents(".item");
            var thing = this._things.get(item.data('id'));
            thing.share();
            
            return false;
        },

        _showPreloader: function() {
            if (this.$preloader.parents().length == 0) {
                $('#main').after(this.$preloader);
            }

            this.$preloader.show();
        },

        _hidePreloader: function() {
            this.$preloader.hide();
        },
        
        /**
         * Largely duplicated on things/show
         * Should consider moving shared code to Thingle Model?
         */ 
        toggleLike:function (e) {
            var like  = $(e.target),
                thing_el = like.parents('.item'),
                thing_id = thing_el.data('id'),
                verb = like.hasClass('selected') ? 'DELETE' : 'POST';
            
            var action = function() {
                $.ajax({
                  type: verb,
                  url:"/api/things/" + thing_id + "/likes",
                  success: function(){
                    like.toggleClass('selected');
                    var l_el = thing_el.find('.likes');
                    l_el.text(parseInt(l_el.text(),10) + (verb == 'POST' ? 1 : -1));
                  }
                });
            };
            
            // Make sure the user is authenticated
            App.currentUser.checkAuth(action, true);
            
            return false;
        },

        dragStart:function (evt) {
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
        dragEnd:function (evt) {
            console.log('dragEnd');
            //Set class on Body to show that a Thing is not being dragged
            $('body').removeClass('dragging-thing');
        }
    });
});