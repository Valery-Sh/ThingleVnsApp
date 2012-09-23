require('./../user');

var db = require(global.approot + '/common/database'), schema;

schema = new db.Schema({
/*    from_user: {
        type: db.Schema.ObjectId,
        ref: 'User'
    },
*/
    to_fbId: String,
    
    /** Note: http://developers.facebook.com/docs/requests/#deleting */
    request_id: String,
    request_deleted: { type: Boolean, 'default': false },
    request_accepted: { type: Boolean, 'default': false },
    acceptedAt: Date,
    createdAt: {
        type: Date,
        'default': Date.now
    }
});

module.exports = {schema: schema, model: db.model('fbInvite', schema)};