var s3Client = exports.client = require('knox').createClient({
    key: global.config.s3.access_key,
    secret: global.config.s3.secret_key,
    bucket: global.config.s3.bucket
}),
    s3auth = require('knox').auth,
    defaultFolder = 'files',
    storage = {};

storage.redirectURL = null;

storage.buildUrl = function() {
    var path = arguments[0];
    
    if (arguments.length > 1) path = Array.prototype.slice.call(arguments).join('/');
    
    return 'http://' + s3Client.endpoint + '/' + path;
}

storage.uid = function() {
    var uuid = require('node-uuid');
    return uuid.v4();
};

storage.uploadParams = function(modelName, path) {
    var model = require(global.approot + '/common/database').models[modelName],
        params = {
            action: 'https://' + s3Client.endpoint + '/',
            folder: (model.schema.path(path).schema.folder || defaultFolder),
            success_action_redirect: this.redirectURL,
            AWSAccessKeyId: s3Client.key,
            acl: 'public-read',
            policy: this.policy,
            signature: this.signature,
            uid: this.uid()
        };
        
    return params;
};

storage.__defineGetter__('policy', function() {
    var policy = {
        expiration: new Date(Date.now() + 60 * 60 * 2 * 1000),
        conditions: [
            {bucket: s3Client.bucket},
            {acl: 'public-read'},
            {success_action_redirect: this.redirectURL},
            ["starts-with", "$Content-Type", ""],
            ["starts-with", "$key", ""],
            ["content-length-range", 0, 1024 * 1024 * 5]
        ]        
    };
    
    return Buffer(JSON.stringify(policy)).toString('base64');
});


storage.__defineGetter__('signature', function() {
    return s3auth.hmacSha1({secret: s3Client.secret, message: this.policy});
});
    
module.exports = storage;