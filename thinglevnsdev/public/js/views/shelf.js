define(function (require) {
    var html = require('text!tpl/shelf.html'),
        htmlHelper = require('helpers/html')
        unauthorized_html = require('text!tpl/shelf-unauthorized.html'),
        deckhtml = require('text!tpl/shelf-deck.html'),
        Decks = Backbone.Collection.extend({
            model:App.Models.Deck,
            url:'/api/decks',
            initialize:function (url) {
                this.url = url || this.url;
            }
        });

    require('lib/jquery.mousewheel');
    require('lib/bootstrap/bootstrap-carousel');

    return Backbone.View.extend({
        el:'aside#shelf',
        shelf_scroll:null,

        _template:_.template(html),
        _unauthorizedTemplate: _.template(unauthorized_html),
        _deckTemplate:_.template(deckhtml),

        events:{
            'click .b-sale .open':'openSale',
            'click .b-sale .close':'closeSale',
            'click .deck-item a':'showDeckGrid',
            'click .drag-new-deck a':'addNewDeck',
            'dragenter .drag-new-deck a, .drop-zone':'dragEnterNewDeck',
            'dragleave .drag-new-deck a, .drop-zone':'dragLeaveNewDeck',
            'drop .drag-new-deck a, .drop-zone':'dropZoneHandler',
            'dragenter .deck-item img':'dragEnter',
            'dragover .deck-item img, .drag-new-deck, .drop-zone':'dragOver',
            'dragleave .deck-item img':'dragLeave',
            'drop .deck-item img':'dropHandler'

        },

        initialize:function (url) {
            App.on('deckCreated', this.deckCreatedDispatcher, this);
            App.on('shelfdecks:load', this.loadDecks, this);
            App.on('shelfdecks:loaded', this.dropToCreateHelper, this);
            App.on('addToDeck', this.addToDeck, this);
            App.on('Deck:Removed', this.removeDeck, this);
        },

        reinitShelfScroll:function () {
            var wh = $(window).height(),
                deck = $('.b-deck');

            shelf_scroll.height(wh - ( $('header').outerHeight() + $('.b-try').outerHeight() ));// + deck.find('h3').outerHeight() ));
            shelf_scroll.data('jsp').reinitialise();
        },

        openSale:function (e) {
            var open = $(e.target);

            open.parent().prev('.img').slideDown("normal", this.reinitShelfScroll)
                .prev('.close').fadeIn();
        },

        closeSale:function (e) {
            var close = $(e.target);

            close.fadeOut()
                .next('.img').slideUp("normal", this.reinitShelfScroll);
        },

        showDeckGrid:function (evt) {
            var $deck_el = $(evt.target).parents('.deck-item'),
                deck_id = $deck_el.data('id');
            App.router.navigate("/decks/" + deck_id, {trigger:true, replace: true});
            return false;
        },
        
        removeDeck:function(evt){
          console.log('shelf.removeDeck');
          console.log(evt);
          
          var deck_el = this.$el.find('.deck-item[data-id="'+evt.deck.id+'"]'),
              stat_el = $('.stats-collections');
          deck_el.fadeOut();
        },

        addNewDeck:function(e){
            App.popup('decks-new');
        },
        
        deckCreatedDispatcher: function(evt){
          var addQ = this._qAddToDeck;
          
          if(addQ){ addQ.deck_id = evt.deck_id; }
          
          App.trigger('shelfdecks:load');
        },
        dropToCreateHelper: function(evt){
          var self = this,
              addQ = self._qAddToDeck;
          if(addQ && addQ.thing_id){
            self.addToDeck(addQ);
          }
          addQ = {};
        },
        dragEnterNewDeck:function (evt){
          evt.preventDefault();
          $(evt.currentTarget).addClass('deck-drop-hover');
        },
        dragLeaveNewDeck:function (evt){
          $(evt.currentTarget).removeClass('deck-drop-hover');

        },

        dropZoneHandler: function (evt) {
            if (this._detectFileDrop(evt)) {
                this._dropHandlerNewThing(evt);
            } else {
                this._dropHandlerNewDeck(evt);
            }
        },

        _dropHandlerNewDeck: function(evt) {
            var self = this;
            var thing_id = evt.originalEvent.dataTransfer.getData("text/plain"),
                oEvt = evt;
            self._qAddToDeck = {thing_id:thing_id};
            App.popup('decks-new');
            evt.preventDefault();
        },

        _detectFileDrop: function (evt) {
            return evt.originalEvent.dataTransfer.files.length > 0
        },

        _dropHandlerNewThing: function(evt, deckId) {
            if (typeof(window.FileReader) == 'undefined') {
                alert("Drug'n'Drop file upload is not supported by your browser.");
            } else {
                App.popup("thingles/drag-image", {
                    file: evt.originalEvent.dataTransfer.files[0],
                    deckId: deckId
                });
            }
            evt.preventDefault();
        },
    
        dragEnter:function (evt) {
            evt.preventDefault();
            evt.originalEvent.dataTransfer.dropEffect = 'copy';
            var $dropEntered = $(evt.target).parents('.deck-item');
            $dropEntered.addClass('deck-drop-hover');
        },

        dragOver:function (evt) {
            evt.originalEvent.dataTransfer.dropEffect = 'copy';
            evt.preventDefault();
            return false;
        },

        dragLeave:function (evt) {
            var $dropLeft = $(evt.target).parents('.deck-item');
            $dropLeft.removeClass('deck-drop-hover');
        },

        dropHandler:function (evt) {
            var thing_id = evt.originalEvent.dataTransfer.getData("text/plain"),
                $deck_el = $(evt.target).parents('.deck-item'),
                deck_id = $deck_el.data('id');
            if (this._detectFileDrop(evt)) {
                this._dropHandlerNewThing(evt, deck_id);
            } else {
                this.addToDeck({deck_id:deck_id, thing_id:thing_id});
            }
            evt.preventDefault();
        },

        addToDeck: function(opts){
            var self = this,
                url = "/api/decks/" + opts.deck_id +"/things";
            jQuery.post(url, {thingId: opts.thing_id},
              function(data){
                App.trigger('afterRepost', {collection_id: opts.deck_id, thingle_id: opts.thing_id});
                var $deck_el = $(self.el).find('.deck-item[data-id="'+opts.deck_id+'"]');
    
                $deck_el.removeClass('deck-drop-hover');
                //Show the image as the deck representation for feedback
                //This should likely be handled by a proper 'Deck' model / helper
                var img_url = _.find(data.pictures[0].sizes, function(sz){return sz.name == "thumb" || "small"}).url;
                if(img_url){
                  var $item = $('<div class="item"><img src="'+img_url+'"></div>'),
                      $carous_el = $deck_el.find('.carousel');
                  $carous_el.find('.carousel-inner')
                    .append($item);

                  var cItems = $item.parent().children();
                  if ( cItems.length == 2 ){
                    $carous_el.carousel({interval:5000})
                      .data('carousel').sliding = false;
                  }
                  $carous_el.carousel(cItems.index($item));
                  $carous_el.find('.cover').remove();
                }
            });  
        },
        
        loadDecks: function(opts){
          var self = this, thingsOpts = opts && opts.thingsOpts || {data:{limit:-5}};
          /**
           * Ideally we should be able to select Decks to load.
           * Re/loading all the Decks expresses the functionality
           * but can need pervese band-aiding: 
           * no-op since we need to attach a thing first
           */ 
          //if(opts && opts.deck_id){return false;}
          
          //This url should likely be updated later.
          var decksurl = "/api/users/" + App.currentUser.get('_id') + "/decks";
          self._decks = new Decks(decksurl);
          self._decks.on('reset', function(){App.trigger('shelfdecks:loaded');});

          self._decks.fetch({
            success: function(decks){
              $(self.el).find('#deck-list').html(
                self._deckTemplate({decks:decks.models})
              );
              
              decks.each(function(deck){
                var $deck_el = $(self.el).find('.deck-item[data-id="'+deck.get('_id')+'"]');
                
                deck.things.on('reset',function(things){
                  //Get images for anim
                  //Most of this should be made available by Thing itself
                  var imgs = things.map(function(thing){
                            return _.find(thing.get('pictures')[0].sizes,
                    function(size){return size.name=="small";}).url;
                  });
                  //We don't have easy access to various image sizes
                  //$deck_el.find('img').attr('src', imgs.shift() );
                  var $imgs = $deck_el.find('.carousel-inner');
                  
                  _.each(imgs, function(img){$imgs.append($('<div class="item"><img src="'+img+'"></div>'));});
                  if(imgs.length){
                    var $carous_el = $deck_el.find('.carousel');
                    $carous_el.carousel({interval:5000});
                    $carous_el.carousel(1);
                    $carous_el.find('.cover').remove();
                  }
                  
                  self.reinitShelfScroll();
                });
                deck.things.fetch(thingsOpts);
              });
            }
          });
          App.currentUserDecks = self._decks;
        },
        
        render:function () {
            var self = this;
            $(this.el).html(this._unauthorizedTemplate());
            App.currentUser.checkAuth(function () {
                $(self.el).html(self._template());
                htmlHelper.addBookmarklet($("a#bookmarklet-button"), $(this.el));
                self.loadDecks();
                shelf_scroll = $('.scroll-pane','.b-deck').jScrollPane();
                $(window).resize(self.reinitShelfScroll);
            });
        }
    });
});