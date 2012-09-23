var filters = require(global.approot + '/resources/filters'),
    Deck = require(global.approot + '/models/deck'),
    User = require(global.approot + '/models/user'),
    errors = require('./errors');

module.exports = {
    defaultLimit:10,

    index:function (req, res, next) {
        var limit = req.param("limit", this.defaultLimit) * -1,
            offset = req.param("offset", 0);

        Deck.where().limit(limit).skip(offset).asc('name').run(function (err, docs) {
            if (err) next(new errors.ServerError(err));
            else res.send(docs);
        });
    },

    show:function (req, res) {
        res.send(req.deck);
    },

    create:[
        filters.auth,
        function (req, res, next) {
            var deck = new Deck();
            deck.setAttributes(req.body);
            deck.user = req.session.user._id;

            deck.save(function (err, doc) {
                if (err) next(new errors.ServerError(err));
                else {
                  res.send(doc);

                  User.findById(deck.user, function(err, cUser){
                    console.log('user creating deck, stats');
                    cUser.collectionAdded({collection: deck});
                  });

                }
            });
        }
    ],

    update:[
        filters.auth,
        function (req, res, next) {
            req.deck.setAttributes(req.body);
            req.deck.save();
            res.send(req.deck);
        }
    ],

    destroy: [
        filters.auth,
        function (req, res, next) {
            console.log(req);
            var user_id = req.session.user._id;
            if (req.deck.user._id == user_id) {
                req.deck.remove(function (err) {
                    if (err) {
                        next(new errors.ServerError(err));
                    } else {
                        var resObj = {'msg':'Deleted Deck:', 'action':'delete', 'data':{deck:{id:req.deck.id}}};
                        console.log(resObj);
                        res.send(resObj);
                    }
                });
            } else {
                next(new errors.Unauthorized('Not your deck to delete'));
            }
        }
    ],

    load:function (id, fn) {
        Deck.findById(id).populate('user').exec(function (err, doc) {
            if (!doc) fn(new errors.NotFound);
            else fn(null, doc);
        });
    }
};