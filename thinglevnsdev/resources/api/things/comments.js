var filters = require(global.approot + '/resources/filters'),
    errors = require('../errors.js'),
    Comment = require(global.approot + '/models/comment');

var Controller = function() {
    var self = this;

    self.defaultLimit = 10;

    self.index = function(req, res, next) {
        var limit = req.param("limit", this.defaultLimit),
            offset = req.param("offset", 0);

        Comment.where('thing', req.thing._id)
            .populate('author', ['firstName', 'lastName', 'picture'])
            .limit(limit)
            .skip(offset)
            .desc('modifiedAt')
            .run(function (err, docs) {
                if (err) next(new errors.ServerError(err));
                else res.send(docs);
        });
    };

    self.show = function (req, res) {
        res.send(req.thing_comment);
    },

    self.create = [
        filters.auth,
        function(req, res, next) {
            var comment = new Comment();
            comment.setAttributes(req.body);
            comment.author = req.session.user._id;
            req.thing.addComment(comment, function(err, thing) {
                if (err) return next(new errors.ServerError(err));
                res.send(comment);

                var thingCurator = thing.createdUser.toString();
                var commentAuthor = req.session.user._id.toString();
                if (commentAuthor != thingCurator) {
                    var Notification = require(global.approot + '/models/notification');
                    Notification.create({
                        type: 'thing_comment',
                        objects: {
                            thing: thing,
                            comment: comment
                        },
                        user: thing.createdUser,
                        sender: req.session.user
                    });
                }
            });
        }
    ];

    self.update = [
        filters.auth,
        function(req, res, next) {
            req.comment.setAttributes(req.body);
            req.thing.modifiedAt = new Date();
            req.comment.save();
            res.send(req.comment);
        }
    ];

    self.destroy = [
        filters.auth,
        function(req, res, next) {
            req.comment.remove();
            res.send(req.comment);
        }
    ];

    self.load = function(id, fn) {
        Comment.findById(id, function (err, doc) {
            if (!doc) fn(new errors.NotFound);
            else fn(null, doc);
        });
    }
}

module.exports = new Controller();