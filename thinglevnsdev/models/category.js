// initialize dependencies
require('./deck');

var db = require(global.approot + '/common/database'),
    schema = new db.Schema({
        name:String
    });

module.exports = db.model('Category', schema);