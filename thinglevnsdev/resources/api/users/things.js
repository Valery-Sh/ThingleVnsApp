var Thing = require(global.approot + '/models/thing'),
    Deck = require(global.approot + '/models/deck'),
    errors = require('../errors.js');

module.exports = {
    defaultLimit: 10,

    index: function(req, res, next) {
        var from = req.param('from'),
            limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0),
            order = req.param("order", "updatedAt");

        Deck.where('user', req.user._id).run(function (err, docs) {
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
  
            query.desc(order).limit(limit).skip(offset);
            Thing.query(query, function (err, docs) {
                if (err) {
                    next(new errors.ServerError(err));
                    return;
                }
                res.send(docs);
            });
        });
    }
}