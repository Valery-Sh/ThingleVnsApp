define(function (require) {
    require('lib/jquery.form');

    var html = require('text!tpl/things/new.html'),
        Decks = Backbone.Collection.extend({
            model:App.Models.Deck,
            url:'/api/decks'
        }),
        UploadParameters = Backbone.Model.extend({
            url:'/api/things/pictures/upload'
        });

    return Backbone.View.extend({
        auth:true,

        id:'new-thing',
        uploadForm:'form#s3-upload',
        thingForm:'form#thing-form',

        events:{
            'click a.upload-btn':'upload',
            'click a.create-deck-btn':'createDeck',
            'click a.submit-btn':'save'
        },

        mimetypes:{
            'png':'image/png',
            'jpg':'image/jpeg',
            'jpeg':'image/jpeg',
            'gif':'image/gif',
        },

        template:_.template(html),


        initialize:function () {
            this.thing = new App.Models.Thing();
        },

        upload:function () {
            var filename = $('input[type=file]', this.uploadForm).val();

            if (!filename) return alert('Choose the file to upload');

            var ext = filename.match(/[^\.]+$/)[0].toLowerCase(),
                self = this;

            this.filename = this.params.get('folder') + '/' + this.params.get('uid') + '.' + ext;
            $('input[name=key]', this.uploadForm).val(this.filename);

            var content_type = this.mimetypes[ext];
            if (!content_type) return alert('Wrong image type!');
            $('input[name="Content-Type"]', this.uploadForm).val(content_type);


            $(this.uploadForm).ajaxSubmit({
                success:function (response) {
                    console.log(response);
                },
                complete:function (response, textStatus, errorThrown) {
                    var img = $('<img />').attr({
                        src:self.params.get('action') + self.filename
                    });

                    img.error(function () {
                        alert('There was error while uploading your image. Reload the page and try again.');
                    });

                    img.load(function () {
                        $('.image', self.el).empty().append(this);

                        if ($(this).width() > 200) $(this).attr('width', 200);
                        self.showThingForm();
                    });
                }
            });
        },

        showThingForm:function () {
            $('.thing', this.el).show();
            this.thing = new App.Models.Thing();

            this.thing.set('pictures', [
                {fileName:this.filename}
            ]);
        },

        createDeck:function () {
            var deck = new App.Models.Deck();
            deck.set({
                name:$("[name='deck_name']", this.thingForm).val()
            });
            $("[name='deck_name']", this.thingForm).val("");
            deck.save({}, {
                success:function (model, response) {
                    $("option:selected").attr("selected", "");
                    var option = $("<option></option>");
                    option.attr("value", model.get("_id"));
                    option.attr("selected", "selected");
                    option.html(model.get("name"));
                    $("[name='deck']", this.thingForm).prepend(option);
                }
            });
        },

        save:function () {
            this.thing.set({
                title:$('[name=title]', this.thingForm).val(),
                description:$('[name=description]', this.thingForm).val(),
                createdDeck:$('[name=deck] option:selected', this.thingForm).val(),
                tags:$('[name=tags]', this.thingForm).val().replace(/([,;|]\s*)/g, ",").split(",")
            });

            this.thing.save({}, {
                success:function (model, response) {
                    alert('Saved!');
                }
            });
        },

        render:function () {
            var self = this;
            this.params = new UploadParameters();

            this.params.fetch({success:function (model, response) {
                $(self.el).html(self.template({
                    params:model
                }));

                $(self.uploadForm).ajaxForm();
                self.loadDecks();
            }});
        },


        loadDecks:function () {
            var decks = new Decks()
            decks.fetch({
                success:function (collection) {
                    $.each(collection.models, function (index, deck) {
                        $("option:selected").attr("selected", "");
                        var option = $("<option></option>");
                        option.attr("value", deck.get("_id"));
                        option.html(deck.get("name"));
                        $("[name='deck']", this.thingForm).append(option);
                    });
                }
            });
        }
    });
});