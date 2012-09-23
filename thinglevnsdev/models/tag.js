var db = require(global.approot + '/common/database'),
    schema = new db.Schema({
        name: {type: String, index: {unique: true}}
    });


schema.statics.search = function(term, cb) {
    return this.where('name', new RegExp('^' + term)).limit(10).run(cb);
};

module.exports = db.model('Tag', schema);