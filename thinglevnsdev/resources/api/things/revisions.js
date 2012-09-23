var Thing = require(global.approot + '/models/thing')
    Revision = require(global.approot + '/models/revision'),
    filters = require(global.approot + '/resources/filters');

var Controller = function () {
    var self = this;

    self.revert = [
        filters.auth,
        function(req, res, next) {
            var id = req.param("revision_id");
            self.load(id, function(err, revision) {
                if (err) return next(err);
                Thing.findById(req.thing._id).exec(function(err,thing) {
                    var newRevision = thing.createRevision();
                    newRevision.save(function(err, doc) {
                        revision.restore(function (err, thing) {
                            thing.editions.push({
                                author: thing.updatedUser,
                                revision: newRevision._id
                            });
                            thing.updatedUser = req.session.user._id;
                            thing.updatedAt = new Date();
                            thing.save();
                            res.send(thing);
                        });
                    });
                });
            });
        }
    ];

    self.load = function (id, fn) {
        Revision.findById(id, function(err, doc){
            if (!doc) fn(new errors.NotFound);
            else fn(null, doc);
        });
    };
};

module.exports = new Controller();