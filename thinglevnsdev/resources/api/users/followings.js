var filters = require(global.approot + '/resources/filters'),
    User = require(global.approot + '/models/user'),
    Thing = require(global.approot + '/models/thing'),
    Deck = require(global.approot + '/models/deck'),
    errors = require('../errors.js');

var Controller = function() {
    var self = this;

    self.defaultLimit = 10;

    self.index = function(req, res, next) {
        var limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0);

        User.find({"_id": {"$in": req.user.followings}}).limit(limit).skip(offset).run(function(err, docs) {
            if (!docs) next(new errors.NotFound);
            else res.send(docs);
        });
    };

    self.create = [
        filters.auth,
        function(req, res, next) {
            self.load(req.body.userId, function(err, doc, next) {
                if (!doc) return next(new errors.NotFound);

                if (req.user.followings.indexOf(doc._id) < 0) {
                    req.user.followings.push(doc._id);
                    req.user.save(function(err, user) {
                        if(err) return console.log(err);

                        req.session.user.followings = user.followings;
                        var Notification = require(global.approot + '/models/notification');
                        Notification.create({
                            type: 'user_follow',
                            user: doc,
                            sender: req.user
                        });

                        res.send(doc); // must be here to save data in the session
                    });
                } else {
                    req.session.user.followings = req.user.followings;
                    res.send(doc);
                }
            });
        }
    ];

    self.destroy = [
        function(req, res, next) {
            var followerIndex = req.user.followings.indexOf(req.user_following._id);
            if (followerIndex < 0) {
                req.session.user.followings = req.user.followings;
                return next(new errors.NotFound);
            } else {
                req.user.followings.splice(followerIndex, 1);
                req.user.save(function(err, user) {
                    if(err) console.log(err);
                    else req.session.user.followings = user.followings;
                    res.send(req.user_following);
                });
            }
        },
        filters.auth
    ];

    self.things = [
        filters.auth,
        function(req, res, next) {
            var from = req.param('from'),
                limit = req.param("limit", self.defaultLimit) * -1,
                offset = req.param("offset", 0);

            Deck.where('user').$in(req.user.followings).run(function (err, docs) {
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
                    query.where("createdAt").$lt(fromDate);
                }
                
                if (req.param('without') != 'user') {
                 query.populate('createdUser', ['firstName', 'lastName', 'picture']);
                }

                if (req.param('without') != 'deck') {
                    query.populate('createdDeck', ['name']);
                }

                query.limit(limit).skip(offset).desc('createdAt');
                Thing.query(query, function (err, docs) {
                    if (err) {
                        next(new errors.ServerError(err));
                        return;
                    }
                    res.send(docs);
                });
            });
        }
    ];

    self.load = function(id, fn) {
        User.findById(id, function(err, doc){
            if (!doc) fn(new errors.NotFound);
            else fn(null, doc);
        });
    };
}

module.exports = new Controller();