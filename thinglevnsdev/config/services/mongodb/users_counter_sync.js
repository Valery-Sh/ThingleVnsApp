/**
 * Stored JS in MongoDB - for performance and stability
 * 
 * User Stat Counter Recalc
 * 
 * @example
 *  mongo localhost/thingle --shell --eval="user_counters_update_all=false" ./config/services/mongodb/users_counter_sync.js
 * 
 * @ToDo
 *  Evaluate http://www.mongodb.org/display/DOCS/MapReduce espectially incremental.
 *  Sharding currently denies use of many possibilities.
 */

/**
 * 
 * @param {UserObject} user - a user object
 * 
 */ 

var user_counters_update = function(user){
    var userRef = user._id;
    //printjson(userRef);
    var thingStats = db.things.group({key: {}, cond:{createdUser:userRef, likes: {$gt:0}},
        reduce: function(obj,prev){ prev.likedBy += obj.likes;prev.thinglesCreated++;},
        initial: { likedBy:0, thinglesCreated:0}})[0]
        || { likedBy:0, thinglesCreated:0};
        
    printjson(db.getLastErrorObj());
//    printjson(thingStats);
    db.users.update(
      {_id: userRef},  //  query filter
      {$set:{  // new values.
      /**
       * structure:
       * "stats" : {
                "collections" : 29,
                "likedBy" : 152,
                "likes" : 42,
                "thingles" : 64,
                "thinglesCreated" : 39,
                "thinglesRepostedBy" : 0
        }
      */
        "stats.collections": db.decks.count({user:userRef}),
        "stats.thinglesCreated": thingStats.thinglesCreated,
        "stats.likedBy": thingStats.likedBy,
        "stats.likes": db.things.find({likers: userRef}).count()
      }}, 
      false,  //  Upsert - create the model if it doesn't exist
      true    //  Multi-update - not triggered as we go by _id currently though
    );
    moar_counters++;
    return db.getLastErrorObj();
  };



if(user_counters_update_all){ // because you really have to mean it.
  moar_counters = 0;
  db.users.find().forEach(user_counters_update); 

  print(moar_counters + ' Users traversed');
  print('update completed');
} else {
  /** For testing and debugging */

  print('Usage: user_counters_update(ObjectId("4ff6f9af790d8a010000dbe7"))');
}




