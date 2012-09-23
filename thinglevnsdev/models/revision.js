// initialize dependencies
require('./deck');
require('./user');
require('./thing');

var db = require(global.approot + '/common/database'),
    pictureSchema = new db.Schema(),
    locationSchema = new db.Schema(),    
    commentSchema =  new db.Schema({
        author:{type:db.Schema.ObjectId, ref:'User'},
        text:String
    });

pictureSchema.plugin(require('./plugins/picture'));
pictureSchema.add({
    isCover:Boolean,
    sourceURL:String,
    caption:String,
    createdAt:{
        type:Date,
        'default':Date.now()
    }
});
locationSchema.plugin(require('./plugins/location'));

var schema = new db.Schema({
    origin:{
        type:db.Schema.ObjectId,
        ref:'Thing'
    },
    title:{
        type: String,
        'default': ""
    },
    description:{
        type: String,
        'default': ""
    },
    tags:[String],
    links:[String],
    sourceURL:String,
    imageSourceURL:String,
    createdUser:{
        type:db.Schema.ObjectId,
        ref:'User'
    },
    updatedUser:{
        type:db.Schema.ObjectId,
        ref:'User'
    },
    createdDeck:{
        type:db.Schema.ObjectId,
        ref:'Deck'
    },
    createdAt:{
        type:Date,
        'default':Date.now
    },
    updatedAt:{
        type:Date,
        'default':Date.now
    },
    pictures:[pictureSchema],
    comments:[commentSchema],
    locations:[locationSchema],
    visible:{
        type:Boolean,
        'default':false
    },
    likes: {type: Number, 'default': 0},
    likers: {type: [{type: db.Schema.ObjectId, ref: 'User'}], index: true}
});

schema.methods.restore = function (cb) {
    var obj = this.toObject();
    delete obj._id;
    delete obj.origin;

    var Thing = require('./thing');
    Thing.findById(this.origin, function(err, thing){
        if (thing) {
            thing.setAttributes(obj);
        }
        cb(err, thing);
    });
}

module.exports = db.model('Revision', schema);