require('./app');
require('./common/redis');

var jobs = require('kue').createQueue(),
    User = require('./models/user'),
    Notification = require('./models/notification'),
    async = require('async');

jobs.process('notification', 5, function(job) {
    var user_id = typeof job.data.user == 'object' ? job.data.user._id : job.data.user,
        params = job.data;

    if (!user_id) return job.remove();

    async.waterfall([
        function(cb) {
            User.findById(user_id, cb);
        },
        function(user, cb) {
            if (user == null) return cb(new Error('no such user ' + user_id));
            params.user = user;
            Notification.deliver(params, cb);
        }
    ], function(err, result) {
        if (err) console.log(err);
        console.log('notified user ' + user_id + ' ' + job.data.type);
        job.remove();
    });
});