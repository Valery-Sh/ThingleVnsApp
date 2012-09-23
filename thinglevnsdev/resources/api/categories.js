var filters = require(global.approot + '/resources/filters'),
    Category = require(global.approot + '/models/category'),
    errors = require('./errors');

module.exports = {
    id:"category",

    index:function (req, res, next) {
        Category.where().asc('name').run(function (err, docs) {
            if (err) next(new errors.ServerError(err));
            else res.send(docs);
        });
    },

    show:function (req, res) {
        filters.admin,
            res.send(req.category);
    },

    create:[
        filters.admin,
        function (req, res, next) {
            var category = new Category();
            category.setAttributes(req.body);
            category.save(function (err, doc) {
                if (err) next(new errors.ServerError(err));
                else res.send(doc);
            });
        }
    ],

    update:[
        filters.admin,
        function (req, res, next) {
            req.category.setAttributes(req.body);
            req.category.save();
            res.send(req.category);
        }
    ],

    destroy:[
        filters.admin,
        function (req, res, next) {
            req.category.remove(function (err) {
                if (err) next(new errors.ServerError(err));
                else res.send(req.category);
            });
        }
    ],

    load:function (id, fn) {
        Category.findById(id, function (err, doc) {
            if (!doc) fn(new errors.NotFound);
            else fn(null, doc);
        });
    }
};