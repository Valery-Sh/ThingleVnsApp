var filters = require(global.approot + '/resources/filters'),
    User = require(global.approot + '/models/user'),
    errors = require('./errors');

module.exports = {
    defaultLimit:10,

    index:function (req, res, next) {
        var query = User.where(),
            limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0),
            ids = req.param('ids', null);

        if (ids != null) {
            ids = typeof ids == "string" ? ids.split(',') : ids;
            if (ids.length == 1 && ids[0] == '') return res.send([]);
            query.where('_id').$in(ids);
        }

        query.limit(limit).skip(offset).run(function (err, docs) {
            if (err) next(new errors.ServerError(err));
            else res.send(docs);
        });
    },

    show:function (req, res) {
        res.send(req.user);
    },

    create:function (req, res, next) {
        var user = new User();
        user.setAttributes(req.body);
        user.save(function (err, doc) {
            if (err) next(new errors.ServerError(err));
            else res.send(doc);
        });
    },

    update:[
        filters.auth,
        function (req, res, next) {
            req.user.setAttributes(req.body);
            req.user.save();
            res.send(req.user);
        }
    ],

    destroy:[
        filters.auth,
        function (req, res, next) {
            req.user.remove(function (err) {
                if (err) next(new errors.ServerError(err));
                else res.send(req.user);
            });
        }
    ],

    load:function (id, fn) {
        User.findById(id, function (err, doc) {
            if (!doc) fn(new errors.NotFound);
            else fn(null, doc);
        });
    }
};