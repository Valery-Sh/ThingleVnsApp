var imageProcessing = require(global.approot + '/common/image-processing'),
    Blitline = require(global.approot + '/plugins/blitline_node'),
    storage = require(global.approot + '/common/file-storage'),
    db = require(global.approot + '/common/database'),
    ImageJob = require(global.approot + '/models/image-job');


module.exports = function(schema, options) {
    
    var s3URLPattern = /(\w+\/\w+\/[\w-]+\.\w+)$/;
    
    schema.add({
        imageSourceURL: String,    
        original: String,
        sizes: [{
            url: String,
            name: String,
            width: Number,
            height: Number
        }],
        createdUser:{
            type:db.Schema.ObjectId,
            ref:'User'
        },
        processed: {type: Boolean, 'default': false}

    });

    schema.sizes = global.config.blitline.image_size_map;
    schema.folder = 'pictures';

    schema.virtual('fileName').set(function(fileName){
        this.set('original', storage.buildUrl(fileName));
    });

    schema.virtual('url').set(function(url) {
        this.__url = url;
        this.set('imageSourceURL', url);
    });

    schema.pre('save', true, function(next, done){
        next();
        if (this.__url) return uploadFromUrl(this, done);
        if (this.sizes.length > 0) return done();
        processImage(this, done);
    });

    schema.pre('save', function(next){
        if (!this.isNew) return next();

        this.createdUser = this.parent.updatedUser || this.parent.createdUser;

        next();
    });

    function uploadFromUrl(self, done) {
        var uuid = require('node-uuid');
        var fileName = uuid.v4();
        var extension = self.__url.match(/(\.\w+$)/);
        fileName += extension ? extension[1] : "";
        imageProcessing.process({
            original: self.__url,
            filename: fileName,
            saveOriginal: true,
            sizes: self.schema.sizes,
            folder: self.schema.folder,
            callback: function(result) {
                self.original = result.images.original;
                delete result.images.original;
                onImageProcessingFinish(self, result, done);
            }
        });
    };

    function processImage(self, done) {
        imageProcessing.process({
            original: self.original,
            sizes: self.schema.sizes,
            folder: self.schema.folder,
            callback: function(result) {
                onImageProcessingFinish(self, result, done);
            }
        });
    }

    function onImageProcessingFinish(self, result, done) {
        for (var type in result.images) {
            self.sizes.push({url: toCloudfrontURL(result.images[type]), name: type});
        }
        self.jobId = result.jobId;
        done();
    }

    function toCloudfrontURL(url) {
        if (!global.config.cloudfront || !global.config.cloudfront.host) return url;
        
        var matcher = s3URLPattern.exec(url);
        if (matcher && matcher.length == 2) {
            return "http://" + global.config.cloudfront.host.replace("/", "") + "/" + matcher[1];
        }
        // enable to convert to a cloudfront url
        return url;
    }
    
    schema.post('save', function() {
        var self = this;

        if (typeof self.jobId == 'undefined') return;

        ImageJob.create({
            id: self.jobId,
            pictureId: self._id,
            objectId: self.parent._id,
            path: self.parentArray._path,
            model: self.parent.constructor.modelName
        });
    });

};
