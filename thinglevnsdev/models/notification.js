var jobs = require('kue').createQueue();

var EmailDelivery = function (email, message) {
    if (!global.config.sendgrid) return false;
    this.email = email;
    this.message = message;
    this.sendgrid = new require('sendgrid').SendGrid(global.config.sendgrid.username, global.config.sendgrid.password);
};
EmailDelivery.prototype.deliver = function (cb) {
    if (!this.sendgrid) return cb(); //return false;
    this.sendgrid.send({
        to: this.email,
        from: global.config.sendgrid.from,
        subject: this.message.text,
        text: this.message.text,
        html: this.message.html
    }, function (success, message) {
        console.log("SendGrid (" + success + "):" + message);
    });
    cb();
};

var db = require(global.approot + '/common/database'),
    Schema = new db.Schema({
        type: String,
        objects: db.Schema.Types.Mixed,
        text: String,
        user: {
            type: db.Schema.ObjectId,
            ref: 'User'
        },
        sender: {
            type: db.Schema.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            'default': Date.now
        }
    });

Schema.statics.create = function (params, cb) {
    try {
        var renderer = require("./notifications/" + params.type + ".js");
        var self = this;
        var message = renderer(params);
        jobs.create('notification', message).save(function (a,s) {
            var objects = {};
            for(var key in params.objects) {
                objects[key] = params.objects[key]._id || params.objects[key];
            }
            var notification = new self({
                text: message.activity,
                type: params.type,
                objects: objects,
                user: params.user._id || params.user,
                sender: params.sender._id || params.sender
            });
            notification.save();
            if (typeof cb == "function") cb(a,s);
        });
    } catch (e) {
        console.log("Error on Notification create: " , e);
    }
};

Schema.statics.deliver = function(params, cb) {
    if (!params.user.email) cb();
    var delivery = new EmailDelivery(params.user.email, params);
    delivery.deliver(cb);
};

module.exports = db.model('Notification', Schema);