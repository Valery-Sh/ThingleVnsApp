var mongoose = require('mongoose');
mongoose.set('debug', true);

var dbConnectFn = 'connect';
if (global.config.mongodb.indexOf(',') !== -1) dbConnectFn = 'connectSet';

mongoose[dbConnectFn](global.config.mongodb);

var db = module.exports = mongoose;

db.Schema.prototype.attrAccessible = [];

db.Document.prototype.setAttributes = function (param, value) {
    var params = param;

    if (typeof param == 'string') {
        params = {};
        params[param] = value;
    }

    if (this.schema.attrAccessible.length > 0) {
        for (var key in params) {
            if (this.schema.attrAccessible.indexOf(key) == -1) delete params[key];
        }
    }

    return this.set(params);
};

// dirty hacks for efficient DbRef eager loading
/*
db.Query.prototype.with = function (ref, fields) {
    if (typeof this._with == 'undefined') this._with = [];

    this._with.push({ref:ref, fields:fields});
    return this;
};

db.Query.prototype._run = db.Query.prototype.run;

db.Query.prototype.run = db.Query.prototype.exec = function (op, callback) {
    var self = this;
    switch (typeof op) {
        case 'function':
            callback = op;
            op = null;
            break;
        case 'string':
            this.op = op;
            break;
    }

    this._run.call(this, op, function (err, docs) {
        var run_cb = function (err, docs) {
            if (typeof callback == 'function') callback(err, docs);
        };

        if (typeof self._with == 'undefined' || self._with.length == 0) return run_cb(err, docs);

        docs.forEach(function(doc, i, arr){
            for (var j in self._with) {
                if (typeof self._with[j].ids == 'undefined') self._with[j].ids = [];
                if (typeof self._with[j].callbacks == 'undefined') self._with[j].callbacks = {};
                var id = doc[self._with[j].ref];
                if (typeof id == 'undefined') continue;

                self._with[j].ids.push(id);
                if (typeof self._with[j].callbacks[id.toString()] == 'undefined') self._with[j].callbacks[id.toString()] = [];
                self._with[j].callbacks[id.toString()].push(function(related_doc){
                    arr[i]._doc[self._with[j].ref] = related_doc;
                });
            }
        });

        self._with.forEach(function(relation, index){
            var ref = relation.ref,
                model_ref = self.model.schema.paths[ref].options.ref,
                model = db.models[model_ref];

            model.where('_id').$in(relation.ids)
                .fields(relation.fields)
                .run(function (err, related_docs) {
                    for (var i in related_docs) {
                        relation.callbacks[related_docs[i]._id.toString()].forEach(function(cb) {cb(related_docs[i])});
                    }

                    if (self._with.length == index + 1) run_cb(null, docs);
                })
            ;
        });
    });
};
*/

