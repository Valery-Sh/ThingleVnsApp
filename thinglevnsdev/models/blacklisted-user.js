var redis = require(global.approot + '/common/redis');

var BlacklistedUser = {
    isBlacklisted : function(email, cb) {
        redis.get(getKey(email), function(err, reply) {
            cb(reply ? true : false);
        });
    }
}

function getKey(email) {
    return "blacklisted-user-" + email;
}

module.exports = BlacklistedUser;