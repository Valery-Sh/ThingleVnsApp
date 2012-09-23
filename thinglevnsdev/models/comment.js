// initialize dependencies
var Thing = require('./thing'),
    Notification = require('./notification');
require('./user');

var db = require(global.approot + '/common/database'),
    schema = new db.Schema({
        thing: {type:db.Schema.ObjectId, ref:'Thing'},
        author: {type:db.Schema.ObjectId, ref:'User'},
        text: String,
        createdAt: {
            type:Date,
            'default':Date.now
        },
        modifiedAt: {
            type:Date,
            'default':Date.now
        }
    });

//schema.pre('save', function(next){
//    next();
//
//    var self = this;
//    Thing.findById(self.thing, function(err, doc){
//        if (doc.createdUser.toString() == self.author.toString()) return;
//
//        Notification.create({user: doc.createdUser.toString(), type: 'commented_creator_thingle', thing: doc});
//        console.log('created comment');
//    });
//})

module.exports = db.model('Comment', schema);