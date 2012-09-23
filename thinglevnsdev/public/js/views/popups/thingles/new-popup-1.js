define(function (require) {
    require('lib/jquery.form');
    require('lib/thingle.autocomplete');

    var html = require('text!tpl/popups/thingles/new-popup-1.html'),
        UploadParameters = Backbone.Model.extend({
            url:'/api/things/pictures/upload'
        }),
        HTMLHelper = require('helpers/html'),
        ImageHelper = require('helpers/image');

    return Backbone.View.extend({
        uploadButton: '#upload-image-button',
        uploadForm:'form#upload-image-form',
        grabForm: 'form#grab-image-form',

        events:{
            'submit form#grab-image-form':'_grabImage',
            'click #upload-image-button': '_uploadImage'
        },

        mimetypes:{
            'png':'image/png',
            'jpg':'image/jpeg',
            'jpeg':'image/jpeg',
            'gif':'image/gif'
        },

        template:_.template(html),

        initialize:function () {
            this.thingle = new App.Models.Thing();
        },

        _grabImage: function () {
            var url = $('input[name=url]', this.$grabForm).val();
            if (!url) {
                alert('Enter image url to grab it');
                return false;
            }
            var self = this;
            ImageHelper.chooseFromURL(url, function(file_urls){
                // make sure file_urls is an array
                file_urls = file_urls instanceof Array ? file_urls : [file_urls];
                
                var pictures = new Array();
                for (var i = 0 ; i < file_urls.length ; i++) {
                    pictures.push({
                        sourceURL: url, 
                        url:file_urls[i]
                    });
                }
                self.thingle.set('pictures', pictures);
                self.thingle.set('sourceURL', url);
                
                self._showThingleForm(file_urls[0]);
            }, function () {
                HTMLHelper.hidePreloader($('button.btn-submit',self.$grabForm));
            });
            HTMLHelper.showPreloader($('button.btn-submit', this.$grabForm));
            return false;
        },

        _uploadImage:function () {
            var file_name = $('input[type=file]', this.$uploadForm).val();
            if (!file_name) {
                alert('Choose the file to upload');
                return false;
            }

            HTMLHelper.showPreloader($(this.uploadButton, this.$el));

            var ext = file_name.match(/[^\.]+$/)[0].toLowerCase(),
                self = this;

            this.filename = this.params.get('folder') + '/' + this.params.get('uid') + '.' + ext;
            $('input[name=key]', this.uploadForm).val(this.filename);

            var content_type = this.mimetypes[ext];
            if (!content_type) return alert('Wrong image type!');
            $('input[name="Content-Type"]', this.$uploadForm).val(content_type);

            this.$uploadForm.ajaxSubmit({
                success: function (response) {
                    console.log(response);
                },
                complete: function (response, textStatus, errorThrown) {
                    self.thingle.set('pictures', [
                        {fileName:self.filename}
                    ]);
                    self._showThingleForm(self.params.get('action') + self.filename);
                }
            });
            return false;
        },

        _showThingleForm:function (url) {
            var self = this;
            var img = $('<img />').attr("src", url);

            img.error(function () {
                alert('There was error while uploading your image. Reload the page and try again.');
            });

            img.load(function () {
                App.popup("thingles/new-popup-2", {
                    thingle:self.thingle,
                    img:this
                });
            });

            $(this.el).modal("hide");
        },

        render:function () {
            var self = this;
            this.params = new UploadParameters();
            this.params.fetch({
                success:function (model, response) {
                    $(self.el).html(self.template({
                        params:model
                    }));
                    self.$grabForm = $(self.grabForm, this.$el);
                    self.$uploadForm = $(self.uploadForm, this.$el);
                    self.$uploadForm.ajaxForm();
                }
            });
        }
    });
});