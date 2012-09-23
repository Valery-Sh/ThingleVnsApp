var Thing = require(global.approot + '/models/thing'),
    filters = require(global.approot + '/resources/filters');

var Controller = function () {
    var self = this;

    self.index = [
        function(req, res, next) {
            var from = req.param('from'),
                limit = req.param("limit", self.defaultLimit) * -1,
                offset = req.param("offset", 0),
                regexp = req.tag.replace(/([\^$()[{\\/|<>.*+?])/g, "\\$1");

            var query = Thing.visible();
            query.where('tags', new RegExp('^' + regexp + '$', 'i'))

            if (from) {
                var fromDate = new Date();
                fromDate.setTime(from);
                query.where("createdAt").$lt(fromDate);
            }

            query.limit(limit).skip(offset).desc('updatedAt').desc('createdAt');
            Thing.query(query, function (err, docs) {
                if (err) {
                    next(new errors.ServerError(err));
                    return;
                }
                res.send(docs);
            });
        }
    ];
};

module.exports = new Controller();