var User = require(global.approot + '/models/user'),
    errors = require('../errors.js');

module.exports = {
    defaultLimit: 10,

    index: function(req, res, next) {
        var limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0);

        User.find({followings: req.user._id}).limit(limit).skip(offset).run(function(err, docs) {
            if (!docs) next(new errors.NotFound);
            else res.send(docs);
        });
    }
}