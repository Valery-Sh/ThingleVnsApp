var Blitline = require(global.approot + '/plugins/blitline_node'),
    blitline_app = global.config.blitline.app_id;

module.exports.postbackURL = false;

module.exports.process = function (options) {
    var blitline = new Blitline(),
        job = blitline.addJob(blitline_app, options.original),
        filename = options.filename || options.original.match(/[^\\^\/]+$/)[0];

    if (this.postbackURL) job.postback_url = this.postbackURL;
    if (options.saveOriginal) {
        var func = job.addFunction('no_op');
        func.addSave("original", global.config.s3.bucket, [options.folder, filename].join('/'));
        addHeader(func.save);
    }
    if (options.sizes) {
        for (var type in options.sizes) {
            var sizes = options.sizes[type];
            sizes.only_shrink_larger = true;

            var func = job.addFunction('resize_to_fit', sizes, type);
            func.addSave(type, global.config.s3.bucket, [options.folder, type, filename].join('/'));
            addHeader(func.save);
        }
    }


    blitline.postJobs(function (response) {
        options.callback(parseResponse(response));
    });
};

function parseResponse(response) {
    console.log('blitline', response);
    response = JSON.parse(response);

    var result = {images:{}, jobId:response.results[0].job_id};
    for (var i in response.results[0].images) {
        var image = response.results[0].images[i];

        result.images[image.image_identifier] = image.s3_url;
    }

    return result;
}

function addHeader(save) {
    if (!save) return;
    if (!global.config.cloudfront || !global.config.cloudfront.image_expire_s) return;
    
    // the bitline javascript api doesn't support this option. So set manually.
    if (save.s3_destination) {
        save.s3_destination.headers = {
                "Cache-Control": "public, max-age=" + global.config.cloudfront.image_expire_s
        };
    }
}
