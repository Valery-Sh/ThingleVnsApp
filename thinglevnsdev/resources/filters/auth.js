var errors = require(global.approot + '/resources/errors');

module.exports = function (req, res, next) {
    if (req.session.user) next();
    else next(new errors.Unauthorized);
};