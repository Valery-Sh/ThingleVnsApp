define(function (require) {

    var html = require('text!tpl/popups/thingles/drag-image.html'),
        HTMLHelper = require('helpers/html'),
        ImageHelper = require('helpers/image');

    return Backbone.View.extend({

        mimetypes:[
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif'
        ],

        template: _.template(html),

        initialize: function () {
            var self = this;
            $(this.el).on("show", function () {return self.mimetypes.indexOf(self.options.file.type) >= 0;});
            this.thingle = new App.Models.Thing();
        },

        render:function () {
            if (this.mimetypes.indexOf(this.options.file.type) >= 0) {
                var self = this;
                this._readFileAsDataUrl(function (data, file) {
                    $(self.el).html(self.template({url: data}));
                    self._uploadFile(data, file);
                });
            } else {
                alert("Wrong file type!");
            }
        },

        _readFileAsDataUrl: function (cb) {
            var fr = new FileReader();
            var file = this.options.file;

            fr.onloadend = function (e) {
                if (typeof cb == "function") cb(fr.result, file);
            };
            fr.readAsDataURL(file);
        },

        _uploadFile: function (content, file) {
            var self = this;
            var contentToSend = content.replace(/^data:[\w/;]+base64,/, "");

            $.ajax({
                type: "POST",
                url: "/api/drag_proxy",
                data: {
                    content: contentToSend,
                    type: file.type,
                    fileName: file.name
                },
                dataType: "text",
                success: function (fileName) {
                    self.thingle.set('pictures', [
                        {fileName: fileName}
                    ]);
                    $(self.el).modal("hide");

                    var img = $('<img />').attr("src", content);
                    img.error(function () {
                        alert('There was error while uploading your image. Reload the page and try again.');
                    });
                    img.load(function () {
                        if ($(this).width() > 170) $(this).attr('width', 170);
                        App.popup("thingles/new-popup-2", {
                            thingle: self.thingle,
                            img: this,
                            deckId: self.options.deckId
                        });
                    });
                }
            });
        }
    });
});