var errors = require(global.approot + '/resources/errors');

// TODO: Implement admin auth logic
module.exports = function (req, res, next) {
    if (req.session.user) next();
    else next(new errors.Unauthorized);
};