var User = require(global.approot + '/models/user'),
    Thing = require(global.approot + '/models/thing'),
    Deck = require(global.approot + '/models/deck'),
    errors = require(global.approot + '/resources/errors'),
    filters = require(global.approot + '/resources/filters');

module.exports = new function() {
    var self = this;
    var defaultLimit = 10;

    self.friends = [
        filters.auth,
        function (req, res, next) {
            getFriendsQuery(req).run(function(err, docs) {
                if (err) next(new errors.ServerError(err));
                else res.send(docs);
            });
        }
    ];

    self.friends_things = [
        filters.auth,
        function (req, res, next) {
            var from = req.param('from'),
                limit = req.param("limit", defaultLimit) * -1,
                offset = req.param("offset", 0);

            getFriendsQuery(req).run(function(err, docs) {
                if (err) return next(new errors.ServerError(err));
                if (!docs) return res.send([]);

                var friendsIds = [];
                for(var i = 0; i < docs.length; ++i) {
                    friendsIds.push(docs[i]._id);
                }

                Deck.where('user').$in(friendsIds).run(function (err, docs) {
                    if (err) return next(new errors.ServerError(err));
                    var ids = [];
                    for (var i = 0; i < docs.length; ++i) {
                        ids = ids.concat(docs[i].things);
                    }

                    var query = Thing.visible();
                    query.where('_id').$in(ids);

                    if (from) {
                        var fromDate = new Date();
                        fromDate.setTime(from);
                        query.where("updatedAt").$lt(fromDate);
                        query.where("createdAt").$lt(fromDate);
                    }

                    query.desc('updatedAt').limit(limit).skip(offset);
                    Thing.query(query, function (err, docs) {
                        if (err) {
                            next(new errors.ServerError(err));
                            return;
                        }
                        res.send(docs);
                    });
                });
            });
        }
    ];

    function getFriendsQuery(req) {
        var fbFriends = req.param('fbids', req.session.user.fbFriends);
        return User.find({"fbId": {"$in": fbFriends}});
    }

    self.liked_things = [
        filters.auth,
        function (req, res, next) {
            var from = req.param('from'),
                limit = req.param("limit", defaultLimit) * -1,
                offset = req.param("offset", 0);

            var query = Thing.visible();

            if (from) {
                var fromDate = new Date();
                fromDate.setTime(from);
                query.where("updatedAt").$lt(fromDate);
                query.where("createdAt").$lt(fromDate);
            }
            query.where('likers', req.session.user._id);
            query.limit(limit).skip(offset).desc('updatedAt');
            Thing.query(query, function (err, docs) {
                if (err) {
                    next(new errors.ServerError(err));
                    return;
                }
                res.send(docs);
            });
        }
    ];
};