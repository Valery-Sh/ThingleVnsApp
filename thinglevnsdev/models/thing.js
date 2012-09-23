// initialize dependencies
require('./deck');
require('./user');

var app = require(global.approot + '/common/app'),
    solr = require(global.approot + '/common/solr'),
    SolrSync = require(global.approot + '/models/plugins/solr-sync'),
    SocialJob = require(global.approot + '/models/social-job');

var db = require(global.approot + '/common/database'),
    pictureSchema = new db.Schema(),
    locationSchema = new db.Schema(),
    editionSchema = new db.Schema({
        author:{
            type:db.Schema.ObjectId,
            ref:'User'
        },
        revision:{
            type:db.Schema.ObjectId,
            ref:'Revision'
        },
        createdAt:{
            type:Date,
            'default':Date.now
        }
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
    title : {
        type: String,
        'default': ""
    },
    description : {
        type: String,
        'default': ""
    },
    tags : [
        String
    ],
    links : [
        String
    ],
    sourceURL : String,
    curator : {
        _id : db.Schema.ObjectId,
        fbId : String,
        firstName : String,
        lastName : String,
        picture : {
            small : String,
            medium : String,
            large : String
        }
    },
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
    deck: {
        _id: db.Schema.ObjectId,
        name: String
    },
    createdAt:{
        type:Date,
        'default':Date.now,
        index:true
    },
    updatedAt:{
        type:Date,
        'default':Date.now,
        index:true
    },
    pictures : [
        pictureSchema
    ],
    visible : {
        type : Boolean,
        'default' : false
    },
    likes:{
        type:Number,
        'default':0
    },
    likers : {
        type : [
            {
                type : db.Schema.ObjectId,
                ref : 'User'
            }
        ],
        index:true
    },
    collectors : {
        type : [
            {
                type : db.Schema.ObjectId,
                ref : 'User'
            }
        ],
        index:true
    },
    editions : [
        editionSchema
    ],
    locations : [
        locationSchema
    ],
    settings : {
        map : Boolean
    },
    stats : {
        comments : {
            type : Number,
            'default' : 0
        },
        collected : {
            type : Number,
            'default' : 0
        },
        shared : {
            type : Number,
            'default' : 0
        }
    }
});

schema.attrAccessible = ['title', 'createdDeck', 'description', 'pictures', 'tags',
                          'links', 'sourceURL', 'imageSourceURL', 'locations', 'settings'];

schema.methods.addComment = function (comment, cb) {
    var self = this;
    comment.thing = this._id;
    comment.author = comment.author._id || comment.author;
    comment.save(function (err) {
        if (err) {
            if (typeof cb == "function") cb(err);
        } else {
            self.stats.comments.$inc();
            self.save(function (err, doc) {
                if (typeof cb == "function") cb(err, doc);
            });
        }
    });
};

// Set visibility by picture processing
schema.pre('save', function (next) {
    if (this.visible) return next();

    this.visible = this.pictures.some(function(picture) {
        return picture.processed;
    });

    next();
});

// Solr Sync
schema.post('save', function (self) {
    var sync = new SolrSync();
    sync.addThing(self);
});

// Cache Tags
schema.post('save', function (self) {
    var Tag = require('./tag');
    self.tags.forEach(function (tag) {
        new Tag({name:tag}).save();
    });
});

// Solr Sync
schema.post('remove', function (self) {
    var sync = new SolrSync();
    sync.remove(self);
});

schema.statics.visible = function () {
    return this.where('visible', true);
};

schema.statics.fullTextSearch = function (query, from, options, callback) {
    if (!solr) {
        console.log("Solr not initialized! Text search canceled!");
        typeof callback == "function" && callback(null, []);
        return;
    }

    console.log("Start searching: \"" + query + "\"");

    var self = this;
    from = solr.convertDate(from);
    solr.query("(" + query + " AND visible: true AND updatedAt:[* TO " + from + "])", options, function (err, res) {

        console.log("Solr request finished.");
        if (err) {
            console.log(err.message);
            if (typeof err == "function") callback(err);
            return;
        }

        res = typeof res == "string" ? JSON.parse(res) : res;
        var docs = res.response.docs,
            count = docs.length,
            ids = [];
        for (var i = 0; i < count; ++i) {
            ids.push(docs[i]._id);
        }

        var query = self.find({_id:{$in:ids}}).desc('updatedAt').desc('createdAt');
        self.query(query, callback);
    });
};

schema.statics.query = function (query, cb) {
    // retrieve only necessary attributes
    query.select({
        _id: 1,
        curator: 1,
        title: 1,
        stats: 1,
        likes: 1,
        likers: 1,
        pictures: {"$slice": 1},
        'pictures.sizes': 1,
        deck: 1
    });
    query.run(cb);
};

schema.methods.like = function (user, cb) {
    var self = this;
    /** Workaround for older models without likers attrib */
    if (!this.likers) {
        this.likers = [];
    }
    if (this.likers.indexOf(user._id) != -1) {
        return;
    }

    this.likers.push(user._id);
    this.likes++;
    user.stats.likes++;

    this.save(function (err) {
        if (typeof cb == "function") cb(err, self);
        if (err) {
            return;
        }

        console.log('saving liking user')
        user.save();

        /** update user who received like */
        var User = require('./user');
        User.findById(self.createdUser, function (err, cUser) {
            console.log('user receiving like');
            cUser.likedBy({
                user : user,
                thingle : self
            });
        });
    });
};

schema.methods.unlike = function (user, cb) {
    var self = this;
    /** Workaround for older models without likers attrib */
    if (!this.likers) {
        this.likers = [];
    }
    var likerIndex = this.likers.indexOf(user._id);

    if (likerIndex == -1) {
        return;
    }

    this.likers.splice(likerIndex, 1);
    this.likes--;
    user.stats.likes--;

    this.save(function (err) {
        if (typeof cb == "function") cb(err, self);
        if (err) {
            return;
        }
        console.log('saving user')
        user.save();

        /** update user who received un-like */
        var User = require('./user');
        User.findById(self.createdUser, function (err, cUser) {
            console.log('user receiving un-like');
            cUser.unlikedBy({
                user : user,
                thingle : self
            });
        });
    });
};

schema.methods.createRevision = function () {
    var obj = this.toObject();
    obj.origin = this._id;
    delete obj._id;
    delete obj.editions;

    var Revision = require('./revision');
    return new Revision(obj);
};

schema.methods.addTags = function (tags) {
    var newTags = tags.concat(this.tags);
    this.tags = require(global.approot + '/common/helpers/array').unique(newTags);
};

schema.methods.shareOnSocialNetwork = function() {
    var self = this;

    //Model Object 'version' workaround - defaults seem only to come into play at creation time
    //Older Objects might not have stats.shares
    //Is this really necessary? What would be a better approach?
    var ts = this.stats, tss = ts.shares;
    if(tss){ Thing.update({_id: self._id},{ $inc: { "stats.shares": 1 }},{},function(){console.log('incremented share count');}); }
    else { Thing.update({_id: self._id},{ $set: { "stats.shares": 1 }},{},function(){console.log('set share count to 1');}); }
    
    SocialJob.create(self._id + "", self.get("curator").fbId, {
        message : "http://" + app.settings.requestedHostname + "/#!things/" + self._id,
        picture : self.get("pictures")[0].sizes[0].url,
        link : "http://" + app.settings.requestedHostname + "/#!things/" + self._id,
        name : self.title,
        description : self.description
    }).save();
    
};

var Thing = module.exports = db.model('Thing', schema);
