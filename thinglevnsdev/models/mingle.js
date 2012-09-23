/** Not Currently used */
require('./user');
require('./mingle/fb-invite');

var db = require(global.approot + '/common/database'),

    schema = new db.Schema({
      /** Include ref to user to cater to data-mining perf */
          user:{type:db.Schema.ObjectId, ref:'User'},
          fbInvites:[{type:db.Schema.ObjectId, ref:'fbInvite'}]
      /** Most likely we should consolidate stuff like followers etc. here */
    });
 module.exports = db.model('Mingle', schema);