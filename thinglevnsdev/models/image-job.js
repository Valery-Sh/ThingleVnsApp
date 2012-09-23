var redis = require(global.approot + '/common/redis');

var ImageJob = function (params) {
    for (var i = 0; i < ImageJob.fields.length; ++ i) {
        this[ImageJob.fields[i]] = params[ImageJob.fields[i]];
    }
    this.key = ImageJob.getKey(this.id);
};

ImageJob.getKey = function (id) {
    return 'imagejobs:' + id;
};

ImageJob.fields = ['id', 'pictureId', 'path', 'model', 'objectId'];

ImageJob.create = function (params) {
    var job = new ImageJob(params);

    job.save();

    return job;
};

ImageJob.find = function (id, cb) {
    redis.get(ImageJob.getKey(id), function (err, reply) {
        if (err) return cb(err);
        if (reply) {
            var job = ImageJob.fromJSON(reply);
            return cb(null, job);
        }
        
        console.log("Image job for id '" + id + "' doesn't exist");
    });
};

ImageJob.prototype.save = function () {
    redis.set(this.key, this.toJSON());
};

ImageJob.prototype.process = function (images) {
    var self = this,
        db = require(global.approot + '/common/database'),
        model = db.models[this.model],
        mark_as_processed = function (err, doc) {
            if (err) throw err;
            var pic = doc[self.path].id(self.pictureId),
                sizes = pic.sizes;

            for (var i = 0; i < sizes.length; ++i) {
                for (var j = 0; j < images.length; ++j) {
                    if (sizes[i].name == images[j].image_identifier) {
                        pic.set('sizes.' + i + '.height', images[j].meta.height, Number); 
                        pic.set('sizes.' + i + '.width', images[j].meta.width, Number);
                        break;
                    }
                }
            }
            
            pic.processed = true;
            doc.save();

            self.remove();
        };

    model.findById(this.objectId, mark_as_processed);
};

ImageJob.prototype.remove = function (cb) {
    redis.del(this.key, function (err, resp) {
        if (typeof cb != 'undefined') cb(err, resp);
    });
};

ImageJob.prototype.toJSON = function () {
    var params = {};
    for (var i = 0; i < ImageJob.fields.length; ++ i) {
        params[ImageJob.fields[i]] = this[ImageJob.fields[i]];
    }
    return JSON.stringify(params);
};

ImageJob.fromJSON = function (json) {
    var params = JSON.parse(json);
    return new ImageJob(params);
};


module.exports = ImageJob;
