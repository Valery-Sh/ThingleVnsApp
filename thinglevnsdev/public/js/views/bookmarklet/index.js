define(function (require) {
    require('lib/jquery.form');

    var html = require('text!tpl/bookmarklet/index.html'),
        HtmlHelper = require("helpers/html");
        CookieHelper = require("helpers/cookie"),
        SelectHelper = require("helpers/select");

    return Backbone.View.extend({
        auth:true,
        id:'bookmarklet',
        template:_.template(html),
        events:{
            'click a.submit-btn':'save'
        },

        initialize:function () {
            this.thing = new App.Models.Thing();
            this.thing.set('sourceURL', this.options.source);
            
            // make sure image is an array
            this.options.image = this.options.image instanceof Array ? this.options.image : [this.options.image];
            
            var urls = new Array();
            for (var i = 0 ; i < this.options.image.length ; i++) {
                urls.push({
                    sourceURL: this.options.source, 
                    url: this.options.image[i]
                });
            }
            this.thing.set('pictures', urls);
        },

        save:function () {
            var self = this;
            var selectedCollection = $('[name=deck] :selected').val();
            var share = self.$('[name=share]').attr('checked') ? true : false;

            CookieHelper.setCookie('lastSelectedCollection', selectedCollection);
            var tags = $('[name=tags]').val();
            tags = tags ? tags.replace(/(^[\s,]+|[\s,]+$)/, '').replace(/(\s*,\s*)+/g, ",").split(",") : [];
            this.thing.set({
                title: $('[name=title]').val().replace(/(^\s+|\s+$)/, ''),
                description: $('[name=description]').val().replace(/(^\s+|\s+$)/, ''),
                createdDeck: selectedCollection,
                tags: tags,
                share: share
            });

            var $preloader = HtmlHelper.showPreloader($(".submit-btn"));
            $preloader.css("padding", "2px 25px 3px 0");

            this.thing.save({}, {
                success:function (model, response) {
                    App.popup("success", {
                        src: model.get('pictures')[0].url || model.get('pictures')[0].imageSourceURL,
                        thing: model,
                        onForward: function (href) {
                            var url = (document.location.protocol + '//' + document.location.host+"/").replace(/\/\/$/, "/") + href;
                            window.open(url, '_blank');
                        },
                        beforeHide: function () {
                            window.close();
                        }
                    });
                }
            });
        },

        render:function () {
            var self = this;

            var Decks = Backbone.Collection.extend({
                model:App.Models.Deck,
                url:'/api/users/' + App.currentUser.get("_id") + "/decks"
            });
            self.decks = new Decks();
            self.decks.fetch({
                success:function (collection) {
                    $(self.el).html(self.template({
                        lastSelectedCollection: CookieHelper.getCookie('lastSelectedCollection'),
                        url: self.thing.get('pictures')[0].url,
                        decks: collection.models
                    }));
                    SelectHelper.customize(self.el);
                    console.log('sel', $('select', $(self.el))) ;
                }
            });
        }
    });
});
