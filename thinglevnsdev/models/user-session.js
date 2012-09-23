function isBlacklisted(user, cb) {
    var BlacklistedUser = require('./blacklisted-user');
    
    BlacklistedUser.isBlacklisted(user.get("email"), function(blacklisted) {
        cb(blacklisted);
    });
}

var userSession = module.exports = {

    setUser:function (session, record, data) {
        session.user = record.toObject();
        session.user.fbFriends = [];
        if (data && data.friends && data.friends.data){
            for (var i = 0; i < data.friends.data.length; ++i) {
                session.user.fbFriends.push(data.friends.data[i].id);
            }
        }
    },

    create:function (req, res, next) {
        userSession.user = req.session.user;
        next();
    },

    auth:function (token, session, cb) {
        var User = require('./user');

        if (typeof session.user != 'undefined') return cb(null, session.user);

        User.fetchByAccessToken(token, function (err, user, data) {
            if (err)  {
                cb(err, user);
                return;
            }
            
            isBlacklisted(user, function(blacklisted) {
                
                if (!blacklisted) {
                    userSession.setUser(session, user, data);
                    cb(err, user);
                    return
                } 
                cb("Blacklisted user", user);
            });
        });
    },
    
    logout:function(session) {
        session.destroy();
    }
};