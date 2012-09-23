var ImageJob = require(global.approot + '/models/image-job');
var SocialJob = require(global.approot + '/models/social-job');
var errors = require('./errors');
var storage = require(global.approot + '/common/file-storage');

module.exports = {
    config: function(req, res) {
        res.send({
            fbId: global.config.facebook.app_id,
            imageSizeMap: global.config.blitline.image_size_map,
            ga: global.config.ga,
            gmaps: global.config.gmaps,
            environment: global.config.env
        });
    },
    
    image_postback: function(req, res, next) {
        var postback = JSON.parse(req.param('results'));

        console.log("blitline-postback", postback);
        console.log("blitline-postback", postback.images);

        // process image job
        ImageJob.find(postback.job_id, function(err, job) {
            if (err) return next(new errors.ServerError(err));
            
            job.process(postback.images);
            
            // process social job
            SocialJob.find(job.objectId, function(err, socialJob) {
                if (err) return next(new errors.ServerError(err));
                
                socialJob.process();
            })
        });

        res.send(200);
    },

    drag_proxy: function(req, res) {
        var params = storage.uploadParams('Thing', 'pictures'),
            buffer = new Buffer(req.param('content'), 'base64'),
            type = req.param('type'),
            ext = req.param('fileName').match(/[^\.]+$/)[0].toLowerCase(),
            fileName = params.folder + "/" + params.uid + (ext ? "." + ext : "");

        var client = require('knox').createClient({
            key: global.config.s3.access_key,
            secret: global.config.s3.secret_key,
            bucket: global.config.s3.bucket
        });

        var req = client.put(fileName, {
            'Content-Length': buffer.length,
            'Content-Type': type
        });
        req.on('response', function(r) {
            console.log(r);
            if (200 == r.statusCode) {
                res.send(fileName);
            }
        });
        req.end(buffer);
    }
};