var db = require(global.approot + '/common/database');

module.exports = function(schema, options) {

    schema.add({
        author : {
            type : db.Schema.ObjectId,
            ref : 'User'
        },
        latLng : [
            Number
        ],
        address : String,
        name : String,
        notes : String,
        createdAt : {
            type : Date,
            'default' : Date.now
        },
        modifiedAt : {
            type : Date,
            'default' : Date.now
        }
    });

    schema.pre('save', function(next) {
        // make sure author is the OjectID
        if (this.author && !(this.author instanceof db.Schema.ObjectId)) {
            this.author = this.author._id;
        }

        if (this.isNew && !this.author) {
            this.author = this.parent.updatedUser || this.parent.createdUser;
        }
        if (!this.isNew && this.modifiedPaths.length > 0) {
            this.modifiedAt = new Date();
        }

        next();
    });

};