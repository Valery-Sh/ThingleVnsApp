var redis = require(global.approot + '/common/redis');
var fb = require(global.approot + '/common/facebook');
var async = require('async');

var SocialJob = function(targetId, actorFbId, params) {
    this.targetId = targetId;
    this.actorFbId = actorFbId;
    this.options = {
        message : params.message,
        picture : params.picture,
        link : params.link,
        name : params.name,
        description : params.description
    };
};

SocialJob.getKey = function(id) {
    return 'socialjobs:' + id;
};

SocialJob.create = function(targetId, actorFbId, options) {
    var job = new SocialJob(targetId, actorFbId, options);
    return job;
};

SocialJob.find = function(id, cb) {
    redis.get(SocialJob.getKey(id), function(err, reply) {
        if (err) {
            if (cb instanceof Function) return cb(err);
        }
        if (reply) {
            var job = SocialJob.fromJSON(reply);
            if (cb instanceof Function) cb(null, job);
        }
    });
};

SocialJob.prototype.process = function() {
    var self = this;
    // post to facebook
    async.waterfall([
            function(next) {
                redis.get('fb_app_token', next);
            }, function(token, next) {
                fb.getSessionByAccessToken(token)(function(session) {
                    next(null, session);
                });
            }, function(fb_session, next) {
                fb_session.graphCall("/" + self.actorFbId + "/feed", self.options, 'post')(next);
            }
    ], function(result) {
        var r = result;
    });

    self.remove();
};

SocialJob.prototype.save = function() {
    redis.set(SocialJob.getKey(this.targetId), this.toJSON());
};

SocialJob.prototype.remove = function(cb) {
    redis.del(SocialJob.getKey(this.targetId), function(err, resp) {
        if (cb instanceof Function) cb(err, resp);
    });
};

SocialJob.prototype.toJSON = function() {
    var params = {
        targetId : this.targetId,
        actorFbId : this.actorFbId,
        options : this.options
    };
    return JSON.stringify(params);
};

SocialJob.fromJSON = function(json) {
    var params = JSON.parse(json);
    return new SocialJob(params.targetId, params.actorFbId, params.options);
};

module.exports = SocialJob;