var db = require(global.approot + '/common/database'),
    fbInviteSchema = require(global.approot + '/models/mingle/fb-invite').schema,
    schema = new db.Schema({
        firstName:String,
        lastName:String,
        fbId:String,
        email:String,
        picture:{
            small:String,
            medium:String,
            large:String
        },
        birthday:Date,
        location:{},
        followings:[db.Schema.ObjectId],
        createdAt:{type:Date,
            'default':Date.now
        },
        /**
         * Counters, should probably be named accordingly
         */
        stats: {
            likes: {type: Number, 'default': 0},
            likedBy: {type: Number, 'default': 0},
            thingles: {type: Number, 'default': 0},
            thinglesCreated: {type: Number, 'default': 0},
            thinglesRepostedBy: {type: Number, 'default': 0},
            collections: {type: Number, 'default': 0}
        },
        
        invites: [fbInviteSchema],
        notificationsSettings: {
            comments :   {type: Number, 'default': -1},
            favoriting : {type: Number, 'default': -1},
            reposting :  {type: Number, 'default': -1},
            editing :    {type: Number, 'default': -1},
            following :  {type: Number, 'default': -1}
        }
    })
    ;

schema.virtual("fbFriends")
    .get(function() {
        return this.__fbFriends || [];
    })
    .set(function (value) {
        this.__fbFriends = value;
    });

schema.attrAccessible = ['firstName', 'lastName'];

schema.statics.mapFromFBData = function (data) {
    var user = new this;
    user.mapFromFBData(data);
    return user;
};

schema.methods.mapFromFBData = function (data) {
    this.set({
        firstName:data.first_name,
        lastName:data.last_name,
        fbId:data.id,
        email:data.email,
        picture:{
            small:"http://graph.facebook.com/" + data.id + "/picture?type=small",
            medium:"http://graph.facebook.com/" + data.id + "/picture?type=normal",
            large:"http://graph.facebook.com/" + data.id + "/picture?type=large"
        }
    });
};

schema.methods.follow = function () {
    // TODO: move logic from controller
};

schema.methods.unfollow = function () {
    // TODO: move logic from controller
};


/**
 * @method updatestats
 * responsible for modifying stats
 * @param {Object} data - {attr: stat to modify, op: operation to modify by: add | sub | set, value: value for operation}
 * @example {attr:'likes', op: 'add', value: 2} - increment stats.likes by 2.
 */
// TODO: refactor using $inc method
schema.methods.updateStats = function(data){
  var self = this;
  console.log('user.updateStats');console.log(data);console.log(this.stats);
  
  /** Workaround for mongoose weirdness(?) */
  var statAttrs = Object.keys(this.get('stats'));
  
  statAttrs.forEach(function(key){
    self.stats[key] = self.stats[key];
  });
  var currVal = parseInt(this.stats[data.attr],10);
  if(isNaN(currVal)){currVal = 0;}

  if( data.op == "add"){
    currVal += data.value;
  } else 
  if ( data.op == "sub"){
    currVal -= data.value;
  } else
  if ( data.op == "set"){
    currVal = data.value;
  }
  
  this.stats[data.attr] = currVal;

  this.save();
};

/**
 * @method likedBy
 * @param {Object} data - {user: user who liked, thingle: the thingle that was liked}
 */
schema.methods.likedBy = function(data){
    this.updateStats({attr:"likedBy", op:"add",value:1});
};

/**
 * @method unlikedBy
 * @param {Object} data - {user: user who liked, thingle: the thingle that was liked}
 */
schema.methods.unlikedBy = function(data){
    this.updateStats({attr:"likedBy", op:"sub",value:1});
};

/**
 * @method thingleCreated
 */ 
schema.methods.thingleCreated = function(){
  this.updateStats({attr:"thinglesCreated", op:"add",value:1});
};

/**
 * @method thingleAdded
 */ 
schema.methods.thingleAdded = function(){
  this.updateStats({attr:"thingles", op:"add",value:1});
};

/**
 * @method thingleRemoved
 */ 
schema.methods.thingleRemoved = function(){
  this.updateStats({attr:"thingles", op:"sub",value:1});
};

/**
 * @method thingleDeleted
 */ 
schema.methods.thingleDeleted = function(){
  this.updateStats({attr:"thinglesCreated", op:"sub",value:1});
};

/**
 * @method collectionAdded
 */ 
schema.methods.collectionAdded = function(){
  this.updateStats({attr:"collections", op:"add",value:1});
};

/**
 * @method collectionRemoved
 */ 
schema.methods.collectionRemoved = function(data){
  this.updateStats({attr:"collections", op:"sub",value:1});
};


schema.statics.fetchByAccessToken = function (access_token, cb) {
    var self = this,
        fb = require(global.approot + '/common/facebook');

    var find_or_fetch = function (data) {
        self.findOne({fbId:data.id}, function (err, doc) {
            if (err) return cb(err);
            if (!doc) {
                doc = self.mapFromFBData(data);
                return doc.save(function (err, doc) {
                    var fbIds = []
                    for (var i = 0; i < data.friends.data.length; ++i) {
                        fbIds.push(data.friends.data[i].id);
                    }
                    var Notification = require('./notification');
                    self.find({"fbId": {"$in": fbIds}}).run(function(err, docs) {
                        if (!docs) return;
                        for (var i = 0; i < docs.length; ++i) {
                            Notification.create({user: docs[i], type: 'friend_join', sender: doc});
                        }
                    });

                    cb(null, doc, data);
                });
            }

            if (!doc.email) {
                doc.email = data.email;
                doc.save();
            }
            return cb(null, doc, data);
        });
    };
    var find_on_fb = function (fb_session) {
        fb_session.isValid()(function (is_valid) {
            if (!is_valid) {
                cb(new Error('Authentication failed'));
                return;
            }
            fb_session.graphCall('/me', {fields: "id, first_name, last_name, friends.id, email"})(find_or_fetch);
        });

    };
    fb.getSessionByAccessToken(access_token)(find_on_fb);
};

schema.post('save', function(self){
    var Deck = require('./deck');

    Deck.where('user', self._id).count(function(err, res){
        if (res > 0) return;

        var deck = new Deck();

        deck.user = self._id;
        deck.name = 'My Collection';
        deck.save();
        
        //TODO: make less horrible. Happily not a frequent action.
        self.stats.collections = 1;
        self.save();
    });
});


module.exports = db.model('User', schema);
