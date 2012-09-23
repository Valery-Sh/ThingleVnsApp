var filters = require(global.approot + '/resources/filters'),
    Thing = require(global.approot + '/models/thing'),
    errors = require('../errors.js'),
    app = require(global.approot + '/common/app'),
    SocialJob = require(global.approot + '/models/social-job');

var Controller = function () {
    var self = this;

    self.defaultLimit = 10;

    self.index = function (req, res, next) {
        var from = req.param('from'),
            limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0);

        var query = Thing.visible();
        query.where("_id").$in(req.deck.things);

        if (from) {
            var fromDate = new Date();
            fromDate.setTime(from);
            query.where("createdAt").$lt(fromDate);
        }

        query.limit(limit).skip(offset).desc('updatedAt');
        Thing.query(query, function (err, docs) {
            if (err) {
                next(new errors.ServerError(err));
                return;
            }
            res.send(docs);
        });
    };

    self.create = [
        function (req, res, next) {
            self.load(req.body.thingId, function (err, thing) {
                req.deck.addThing(thing);
                res.send(thing);
                
                if (req.body.share == "true") {
                    SocialJob.create(null, req.session.user.fbId, {
                        message : "http://" + app.settings.requestedHostname + "/#!things/" + thing._id,
                        picture : thing.get("pictures")[0].sizes[0].url,
                        link : "http://" + app.settings.requestedHostname + "/#!things/" + thing._id,
                        name : thing.title,
                        description : thing.description
                    }).process();
                }
            });
        },
        filters.auth
    ];

    self.destroy = [
        filters.auth,
        function (req, res, next) {
            req.deck.removeThing(req.deck_thing);
            res.send(req.deck_thing);
        }
    ];

    self.load = function (id, fn) {
        Thing.findById(id)
            .populate('createdUser', ['firstName', 'lastName', 'picture'])
            .populate('createdDeck', ['name'])
            .exec(function (err, doc) {
                if (!doc) fn(new errors.NotFound);
                else fn(null, doc);
            });
    };
}

module.exports = new Controller();