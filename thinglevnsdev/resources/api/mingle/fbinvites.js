/** Not currently used */

/**
 * TODO: resources/mingle.js FB Friends specific logic should be moved here
 */
/*
var filters = require(global.approot + '/resources/filters'),
    User = require(global.approot + '/models/user'),
    fbInvite = require(global.approot + '/models/mingle/fb-invite'),
    errors = require('../errors.js');

var Controller = function() {
    var self = this;

    self.defaultLimit = 10;

    self.index = function(req, res, next) {
        var limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0);

        fbInvite.find({"from_user": req.user._id}).limit(limit).skip(offset).run(
          function(err, docs) {
            if (!docs){ next(new errors.NotFound); }
            else {res.send(docs);}
        });
    };


}

module.exports = new Controller();
*/