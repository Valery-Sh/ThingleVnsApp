var Notification = require(global.approot + '/models/notification'),
    filters = require(global.approot + '/resources/filters'),
    errors = require('../errors.js'),
    ejs = require('ejs'),
    fs = require('fs');

module.exports = resource = {
    defaultLimit: 10,

    index: function (req, res, next) {
        var limit = (req.param('limit') || resource.defaultLimit),
            offset = (req.param('offset') || 0);

        Notification.where('user', req.session.user._id)
            .populate('sender', ['_id', 'picture'])
            .desc("createdAt")
            .limit(limit).skip(offset)
            .exec(function (err, docs) {
            if (err) next(new errors.ServerError(err));
            else res.send(docs);
        });
    },

    show: [
        filters.auth,
        function (req, res) {
            res.send(req.notification);
        }
    ],

    load:function (id, fn) {
        Notification.findById(id)
            .populate('user', ['_id', 'firstName', 'lastName', 'picture'])
            .populate('sender', ['_id', 'firstName', 'lastName', 'picture'])
            .exec(function (err, doc) {
                if (!doc) fn(new errors.NotFound);
                else fn(null, doc);
            }
        );
    }
};