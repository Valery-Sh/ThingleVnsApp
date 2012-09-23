var errors = require(global.approot + '/resources/errors'),
    userSession = require(global.approot + '/models/user-session'),
    filters = require(global.approot + '/resources/filters');

module.exports = {
    create:function (req, res, next) {
        userSession.auth(req.param("access_token"), req.session, function (err, user) {
            if (err) next(new errors.Unauthorized);
            else res.send(user);
        });
    },

    show:[
        filters.auth,
        function (req, res) {
            res.send(req.session.user);
        }
    ],
    
    destroy:[
          filters.auth,
          function (req, res) {
              userSession.logout(req.session);
              res.end();
          }
    ]
};