var Deck = require(global.approot + '/models/deck'),
    errors = require('../errors.js');

module.exports = {
    defaultLimit:10,

    index:function (req, res, next) {
        var limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0);

        Deck.where('user', req.user._id).limit(limit).skip(offset).asc('name').run(function (err, docs) {
            res.send(docs);
        });
    }
}