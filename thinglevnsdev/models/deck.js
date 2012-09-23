// initialize dependencies
require('./thing');
require('./user');

var SolrSync = require(global.approot + '/models/plugins/solr-sync'),
    db = require(global.approot + '/common/database'),
    pictureSchema = new db.Schema({
        sizes:[
            {
                url:String,
                name:String,
                width:Number,
                height:Number
            }
        ],
        isCover:Boolean,
        createdAt:{
            type:Date,
            'default':Date.now
        }
    }),
    schema = new db.Schema({
        name:String,
        user:{type:db.Schema.ObjectId, ref:'User'},
        pictures:[pictureSchema],
        things:[
            {
                type:db.Schema.ObjectId,
                ref:'Thing'
            }
        ],
        tags:[String],
        createdAt:{
            type:Date,
            'default':Date.now,
            index:true
        },
        updatedAt:{
            type:Date,
            'default':Date.now,
            index:true
        }
    });

schema.methods.addThing = function (thing, cb) {
    var self = this,
        id = thing._id,
        index = this.things.indexOf(id);

    if (index < 0) {
        this.things.push(id);

        //Model Object 'version' workaround - defaults seem only to come into play at creation time
        //Older Objects might not have stats.collected
        //Is this really necessary? What would be a better approach?
        //Also - counter might be overkill considering that we have the collectors.length
        var ts = thing.stats, tsc = ts.collected;
        if(tsc) {
            tsc.$inc();
        }
        else {
            ts.collected = thing.collectors.length;
        }

        thing.addTags(self.tags.concat(self.name));
        thing.collectors.push(self.user);
        thing.save(cb);

        var deckOwner = (self.user._id ? self.user._id : self.user).toString();
        var thingOwner = (thing.createdUser._id ? thing.createdUser._id : thing.createdUser).toString();
        if (deckOwner != thingOwner) {
            var Notification = require('./notification');
            Notification.create({
                type: 'thing_collect',
                user: thing.createdUser,
                objects: {
                    thing: thing,
                    deck: self
                },
                sender: self.user
            });
        }

        /** update user who added thingle */
        var User = require('./user');
        User.findById(this.user, function (err, cUser) {
            console.log('user adding a thing');
            cUser.thingleAdded({thingle_id:id});
        });
        this.save();
    }
};

schema.methods.removeThing = function (thing, cb) {
    var id = thing._id,
        index = this.things.indexOf(id);
    if (index >= 0) {
        this.things.splice(index, 1);
        this.save(cb);

        var i = thing.collectors.indexOf(this.user._id || this.user);
        if (i >= 0) {
            thing.collectors.splice(i, 1);
        }
        if (thing.deck && thing.deck.id && thing.deck._id.toString() == this._id.toString()) {
            thing.createdDeck = null;
            thing.deck = null;
        }
        
        //Model Object 'version' workaround - defaults seem only to come into play at creation time
        //Older Objects might not have stats.collected
        //Is this really necessary? What would be a better approach?
        //Also - counter might be overkill considering that we have the collectors.length
        //However, at the moment we can't be sure that the collectors array is actually complete
        var ts = thing.stats,
            tsc = ts.collected;
        if (tsc) {
            tsc.$inc(-1);
        } else {
            ts.collected = thing.collectors.length;
        }
        thing.save();

        /** update user who removed thingle */
        var User = require('./user');
        User.findById(this.user, function (err, cUser) {
            console.log('user removing a thing');
            cUser.thingleRemoved({thingle_id: id});
        });
    }
};

schema.post('save', function (self) {
    var sync = new SolrSync();
    require(global.approot + '/models/thing').find({_id:{$in:self.things}}).run(function (err, docs) {
        sync.addCollection(docs);
    });
});

schema.post('remove', function (self) {
    var Thing = require('./thing');
    /** I guess the question is if we should also decrement collectors stats for this, and hence start it from 1 */
    Thing.update({createdDeck: self._id}, {createdDeck: null, deck: null}, {multi: true}, function (err) {
        if (err) console.log("On post Deck removing:", err);
    });

    /** update user who removed deck */
    var User = require('./user');
    User.findById(this.user, function (err, cUser) {
        console.log('user deleting a collection');
        if (err) {
            next(new errors.ServerError(err));
        }
        cUser.collectionRemoved({collection:self});
    });
});

module.exports = db.model('Deck', schema);
