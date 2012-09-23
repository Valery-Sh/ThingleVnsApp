var Tag = require(global.approot + '/models/tag'),
    errors = require('./errors');

module.exports = {
    index: function(req, res) {
        Tag.search(req.param('q'), function(err, docs) {
            if (err) next(new errors.ServerError(err));
            else res.send(docs);
        });
    },

    load: function (tag, fn) {
        if (tag) fn(null, "" + tag)
        else fn(new errors.NotFound);
    }
};