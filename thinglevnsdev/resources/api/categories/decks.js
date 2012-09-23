var Deck = require(global.approot + '/models/deck');

var Controller = function () {
    var self = this;

    self.defaultLimit = 10;

    self.index = function (req, res, next) {
        var limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0);

        Deck.find({tags:req.category.name}).limit(limit).skip(offset).run(function (err, docs) {
            if (err) next(new errors.ServerError(err));
            else res.send(docs);
        });
    };
}

module.exports = new Controller();