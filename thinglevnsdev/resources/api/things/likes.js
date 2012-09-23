var filters = require(global.approot + '/resources/filters');

var resource = module.exports = {

    create: [
        filters.auth,
        loadUser,
        function(req, res) {
            req.thing.like(resource.user, function(err, thing) {
                if (err) return;
                var createdUser = (thing.createdUser._id || thing.createdUser).toString();
                var likededUser = resource.user._id.toString();
                if (likededUser != createdUser) {
                    var Notification = require(global.approot + '/models/notification');
                    Notification.create({
                        type: 'thing_like',
                        objects: {thing: thing},
                        user: createdUser,
                        sender: resource.user
                    });
                }
            });
            res.send(201);
        }
    ],

    destroy: [
        filters.auth,
        loadUser,
        function(req, res) {
            req.thing.unlike(resource.user);
            res.send(200);
        }
    ]
};


function loadUser(req, res, next) {
    var User = require(global.approot + '/models/user');

    User.findById(req.session.user._id, function(err, doc){
        if (err) next(err);

        resource.user = doc;
        next();
    });
}