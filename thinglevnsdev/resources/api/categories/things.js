var Thing = require(global.approot + '/models/thing');

var Controller = function () {
    var self = this;

    self.defaultLimit = 10;

    self.index = function (req, res, next) {
        var from = req.param('from'),
            limit = req.param("limit", self.defaultLimit) * -1,
            offset = req.param("offset", 0);

        var query = Thing.visible();
        query.find({tags: req.category.name.toLowerCase()});

        if (from) {
            var fromDate = new Date();
            fromDate.setTime(from);
            query.where("createdAt").$lt(fromDate);
        }

        query.limit(limit).skip(offset).desc('updatedAt').desc('createdAt').run(function (err, docs) {
            if (err) next(new errors.ServerError(err));
            else res.send(docs);
        });
    };
}

module.exports = new Controller();