var Thing = require(global.approot + '/models/thing'),
    Deck = require(global.approot + '/models/deck'),
    User = require(global.approot + '/models/user'),
    filters = require(global.approot + '/resources/filters'),
    errors = require('./errors');

var resource = module.exports = {
    defaultLimit:10,

    index:function (req, res, next) {
        var limit = (req.param('limit') || resource.defaultLimit),
            offset = (req.param('offset') || 0),
            from = req.param('from'),
            textSearchQuery = req.param('q');

        if (!textSearchQuery) {
            var query = Thing.visible(),
                ids = req.param('ids', null);

            if (from) {
                var fromDate = new Date();
                fromDate.setTime(from);
                query.where("updatedAt").$lt(fromDate);
                query.where("createdAt").$lt(fromDate);
            }

            if (ids != null) {
                ids = ids.split(',');
                if (ids.length == 1 && ids[0] == '') return res.send([]);

                query = query.where('_id').$in(ids);
            }
            else {
                query = query.limit(limit).skip(offset).desc('updatedAt');
            }

            Thing.query(query, function (err, docs) {
                if (err) {
                    next(new errors.ServerError(err));
                    return;
                }
                res.send(docs);
            });
        }
        else {
            var fromDate = new Date();
            fromDate.setTime(from);
            Thing.fullTextSearch(textSearchQuery, fromDate, {start:offset, rows:limit, sort:"updatedAt desc"}, function (err, docs) {
                if (err) next(new errors.ServerError(err));
                else res.send(docs);
            });
        }
    },

    show:function (req, res) {
        res.send(req.thing);
    },

    create:[
        filters.auth,
        function (req, res, next) {
            // extract the share option before setting on the Thingle.
            var share = req.body.share;
            
            var thing = new Thing();
            thing.setAttributes(req.body);
            thing.createdUser = req.session.user._id;
            thing.curator = {
                _id: req.session.user._id,
                fbId: req.session.user.fbId,
                firstName: req.session.user.firstName,
                lastName: req.session.user.lastName,
                picture: req.session.user.picture
            };

            Deck.findById(thing.createdDeck, function (err, deck) {
                if (err){ return next(new errors.ServerError(err));}

                thing.save(function (err, thing) {
                    if (err) return next(new errors.ServerError(err));
                    if (deck){
                        deck.addThing(thing);
                    } else {
                        console.log("no err, but no deck :(")
                    }

                    res.send(thing);

                    User.findById(thing.createdUser, function(err, cUser){
                        if (err){ return next(new errors.ServerError(err));}
                        console.log('user creating Thingle, stats');
                        cUser.thingleCreated({thingle: thing});
                    });
                    
                    if (share) {
                        thing.shareOnSocialNetwork();
                    }
                });
            });
        }
    ],

    update:[
        filters.auth,
        function (req, res, next) {
            // Trying to avoid conflicts with refered entities
            Thing.findById(req.thing._id).exec(
                function (err, thing) {
                    var revision = thing.createRevision();
                    revision.save(function (err, doc) {
                        if (err) return next(err);
                        req.thing.editions.push({
                            author: req.thing.updatedUser || thing.createdUser,
                            createdAt: req.thing.updatedAt || req.thing.createdAt,
                            revision: revision._id
                        });
                        req.thing.updatedUser = req.session.user._id;
                        req.thing.updatedAt = new Date();
                        req.thing.setAttributes(req.body);
                        req.thing.save();

                        // Send modified user object to client
                        var resultThing = req.thing.toObject();
                        resultThing.updatedUser = req.session.user;
                        res.send(resultThing);

                        // TODO: move to separate method
                        // Send Notification
                        var createdUser = (req.thing.createdUser._id || req.thing.createdUser).toString();
                        var updatedUser = (req.thing.updatedUser._id || req.thing.updatedUser).toString();

                        var Notification = require(global.approot + '/models/notification');
                        if (updatedUser != createdUser) {
                            Notification.create({
                                type: 'thing_change',
                                objects: {thing: req.thing},
                                isCurator: true,
                                user: createdUser,
                                sender: req.session.user
                            });
                        }

                        var notifiedUsers = [createdUser];
                        req.thing.editions.forEach(function(edition) {
                            var author = edition.author.toString();
                            if (author != updatedUser && author != createdUser && notifiedUsers.indexOf(author) == -1) {
                                notifiedUsers.push(author);
                                Notification.create({
                                    type: 'thing_change',
                                    objects: {thing: req.thing},
                                    isCurator: false,
                                    user: author,
                                    sender: req.session.user
                                });
                            }
                        });
                    });
                }
            );
        }
    ],

    pictures_upload:[
        filters.auth,
        function (req, res) {
            var storage = require(global.approot + '/common/file-storage');
            try {
                res.send(storage.uploadParams('Thing', 'pictures'));
            }
            catch (e) {
                console.log(e);
            }
        }
    ],

    share: [
        filters.auth,
        function (req, res) {
            var Notification = require(global.approot + '/models/notification');
            Notification.create({
                type: 'thing_share',
                user: req.thing.createdUser,
                sender: req.session.user,
                objects: {thing: req.thing}
            });
            res.send(200);
        }
    ],

    load:function (id, fn) {
        Thing.findById(id)
            .populate('createdUser', ['firstName', 'lastName', 'picture'])
            .populate('updatedUser', ['firstName', 'lastName', 'picture'])
            .populate('pictures.createdUser', ['firstName', 'lastName', 'picture'])
            .populate('createdDeck', ['name'])
            .populate('locations.author', ['firstName', 'lastName', 'picture'])
            .exec(function (err, doc) {
                if (!doc) fn(new errors.NotFound);
                else fn(null, doc);
            })
        ;
    }
};
