define(function (require) {
    require('lib/jquery.form');
    require('lib/thingle.autocomplete');

    var html = require('text!tpl/popups/thingles/new-popup-2.html'),
        Decks = Backbone.Collection.extend({
            model:App.Models.Deck,
            initialize: function(user_id) {
                this.url = '/api/users/' + user_id + '/decks';
            }
        }),
        Tags = Backbone.Collection.extend({
            url: '/api/tags',
            model: App.Models.Tag
        }),
        SelectHelper = require("helpers/select"),
        HTMLHelper = require('helpers/html'),
        ImageHelper = require('helpers/image');

    return Backbone.View.extend({
        auth: true,

        _pictures: [],
        _links: [],

        events:{
            'click .toggle-options':'_toggleOptions',
            'click .add-link':'_toggleAddLinkField',
            'submit form.add-link-form':'_addLink',
            'click ul.attached-files li a.remove': '_removeLink',
            'click a#link-change-image':'_selectDifferentImage',
            'click button.btn-submit':'_onSubmit',
            'submit form.add-tag-form': '_addTag'
        },

        template:_.template(html),
        _fileTemplate: _.template('<li data-index="<%= index %>"><span><%= fileName %></span><a href="javascript:void(0)" class="remove">*</a></li>'),

        initialize:function () {
            this._thingle = this.options.thingle;
            if (typeof this.options.img == 'undefined')
                this.options.img = $('<img />').attr('src', this._thingle.getCoverPicture('medium').url);
            this._links = this._thingle.get('links') || [];
            this._pictures = [];

            this._updateAttachedCounter();
        },

        _selectDifferentImage:function () {
            $(this.el).modal('hide');
            App.popup("thingles/new-popup-1");
            return false;
        },


        _updateAttributes: function() {
            var attributes = {},
                self = this;

            _.each(['title', 'description', 'tags'], function(attr){
                var val = self.$('[name=' + attr + ']').val().replace(/(^\s+|\s+$)/, '');
                if (typeof val != 'undefined' && val != '') attributes[attr] = val;
            });

            var deck = self.$('[name=deck] option:selected').val();
            if (typeof deck != 'undefined' && deck != '0' && deck != '') attributes.createdDeck = deck;

            attributes.share = self.$('[name=share]').attr('checked') ? true : false;

            attributes.tags = attributes.tags ? attributes.tags.replace(/(^[\s,]+|[\s,]+$)/, '').replace(/(\s*,\s*)+/g, ",").split(",") : [];

            attributes.pictures = this._thingle.get('pictures');

            _.each(attributes.pictures, function(picture, index){
                if (typeof picture.createdUser == 'object' && picture.createdUser._id) {
                    attributes.pictures[index].createdUser = picture.createdUser._id;
                }
            });

            _.each(this._pictures, function(picture){
                attributes.pictures.push(picture);
            });

            this._thingle.set(attributes);
        },

        validate: function() {
            var $fields = this.$('.required:input');
            if (!this._thingle.isNew()) return true;

            $fields.removeClass('error');

            _.each($fields, function(field) {
                console.log(field);
                if (($(field).is('select') && $('option:selected', field).val() == '')
                    || ($(field).is(':not(select)') && $(field).val() == '')) {
                    $(field).addClass('error');
                }
            });

            return $fields.filter('.error').length == 0;
        },

        _onSubmit:function () {
            if (!this.validate()) return false;

            HTMLHelper.showPreloader($('button.btn-submit', this.el));

            var self = this;
            this._thingle.fetch({
                success: function(model) {
                    self._updateAttributes();
                    self._thingle.save({}, {success: thingleSaved});
                }
            });

            function thingleSaved(model) {
                $(self.el).modal("hide");
                App.popup("success", {title:"Create a Thingle", src:self._src, thing: self._thingle});
                if (typeof self.options.onSubmit == 'function') self.options.onSubmit();
            }
        },

        _addLink: function() {
            this._toggleAddLinkField();

            var $field = $('[name=link]', this.el),
                link = $field.val();

            if (link == '') return false;

            $field.val('');

            var $submitBtn = this.$('.btn-submit'),
                self = this;
            HTMLHelper.showPreloader($submitBtn);
            ImageHelper.chooseFromURL(link, function(urls){
                self._addImageURL(link, urls);
            }, function(){HTMLHelper.hidePreloader($submitBtn);});
        },

        _addImageURL: function(link, urls) {
            // make sure urls is an array
            urls = urls instanceof Array ? urls : [urls];
            for (var i = 0 ; i < urls.length ; i++) {
                var index = this._pictures.push({sourceURL: link, url: urls[i]}) - 1;
                var $li = $(this._fileTemplate({fileName: urls[i], index: index}));
                $li.hide().appendTo($('ul.attached-files', this.el)).slideDown('fast');                
            }

            this._updateAttachedCounter();
        },

        _removeLink: function(e) {
            var $li = $(e.target).parents('li');

            this._pictures.splice($li.attr('data-index'), 1);

            $li.slideUp('fast', function() {$(this).remove();});

            this._updateAttachedCounter();
        },

        _updateAttachedCounter: function() {
            var $counter = $('.attached-count strong', this.el),
                count = this._pictures.length;

            $counter.text(count.toString());
            if (count == 1) $counter.siblings('span.plural-s').hide();
            else $counter.siblings('span.plural-s').show();
        },

        _addTag: function() {
            var $tags = $('[name=tags]', this.el)
                $tag = $('[name=add-tag]'),
                tags = $tags.val();

            if ($tag.val() == '') return;

            $tags.val(tags == '' ? $tag.val() : tags + ',' + $tag.val());
            $tag.val('');
        },

        _toggleAddLinkField:function () {
            var popup = $(this.el),
                but = $('.add-link', popup);

            if (!but.is(':disabled')) {
                but.prop('disabled', true);
            } else {
                but.prop('disabled', false);
            }

            $('.add-link-field', popup).slideToggle("fast");
        },

        _closeAddLinkField:function (e) {
            var but = $(e.target),
                popup = $(this.el);

            but.prop('disabled', false);
            $('.add-link-field', popup).slideDown("fast");
        },

        _toggleOptions:function (e) {
            var popup = $(this.el),
                modal_top = popup.find('.modal-top'),
                modal_bot = popup.find('.modal-bottom'),
                toggle = $(e.target);

            modal_bot.slideToggle();

            if (!popup.hasClass('opened')) {
                toggle.text('Close Options');
                modal_top.children('.modal-top-inner').fadeOut(100).end()
                    .animate({
                        height:15
                    }, 'normal',function(){
                        popup.find('.scroll-pane').jScrollPane({
                            autoReinitialise:true,
                            mouseWheelSpeed:100
                        });
                    });
            } else {
                toggle.text('Open Options');
                modal_top.animate({
                    height:451
                }, 'normal', function () {
                    $(this).children('.modal-top-inner').fadeIn('fast')
                });
            }
            popup.toggleClass('opened');
        },

        _displayOptions: function() {
            this.$('.tab-main').hide();
            this.$('.tab-options').show();
            $(this.el).addClass('opened');
        },

        _createDeck: function(e) {
            var $container = $(e.target).parents('.new-deck-field');
            var name = $('input[type=text]', $container).val();
            var self = this;

            if (!name) return;

            $(self.el).modal('hide');
            $(e.target).parents('.combo-list').hide();
            App.popup('decks-new', {deckName: name});
            App.on('deckCreated', function(params){
                $(self.el).modal('show');
                self.$('select[name=deck]')
                    .append('<option value="' + params.deck_id + '">' + name + '</option>')
                    .val(params.deck_id)
                    .change()
                ;
            });
        },

        render:function () {
            var self = this;
            self._src = $(self.options.img).attr('src');
            var decks = new Decks(App.currentUser.get('_id'));
            decks.fetch({
                success:function (collection) {
                    $(self.el).html(self.template({
                        decks:collection.models,
                        selectedDeckId: self.options.deckId
                    }));
                    if (!self._thingle.isNew()) {
                        self._displayOptions();
                        $('[name=tags]', self.el).val(self._thingle.get('tags').join(','));
                        self.$('h3').text('Add More Content');
                        self.$('.btn-submit').text('Add Content');
                    } else {
                        $(".img", self.el).append(self.options.img);
                        self._onImageLoad(function (img) {
                            if (($(img)[0].naturalWidth < 220) || ($(img)[0].naturalHeight < 100)) {
                                alert("Image is too small!");
                                $(self.el).modal('hide');
                                App.popup("thingles/new-popup-1");
                            }
                        });
                    }

                    SelectHelper.customize(self.el);
                    $('.new-deck-field .btn-primary').live('click', function(e){self._createDeck(e)});

                    $('input[name=add-tag]', this.el).autocomplete({
                        collection: new Tags,
                        attr: 'name'
                    });
                }
            });
        },

        _onImageLoad: function (cb) {
            if (typeof cb != "function") {
                return;
            }
            var $img = $(this.options.img);
            if ($img.width() == 0 && $img.height() == 0) {
                $img.load(function () {
                    cb(this.options.img);
                });
            } else {
                cb(this.options.img);
            }
        }
    });
});