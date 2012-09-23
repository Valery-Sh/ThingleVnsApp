var solr = require(global.approot + '/common/solr');

module.exports = function () {
    var self = this,
        Deck = require(global.approot + '/models/deck'),
        requests = 0;

    self.remove = function (thing, fn) {
        if (!solr) {
            console.log("Solr not initialized! Sync action 'remove' canceled!");
            typeof fn == "function" && fn();
            return;
        }

        if (fn === undefined) {
            fn = thing;
            delete thing;
        }

        ++requests;
        var id = thing ? thing._id : null;
        solr.del(id, "*", function (err) {
            console.log(err);
            --requests;
            commitSolr(fn);
        });
    }

    self.addCollection = function (docs, fn) {
        if (!solr) {
            console.log("Solr not initialized! Sync action 'add collection' canceled!");
            typeof fn == "function" && fn();
            return;
        }
        for (var i in docs) {
            self.addThing(docs[i], fn);
        }
    }

    self.addThing = function (thing, fn) {
        if (!thing.visible) {
            return;
        }

        if (!solr) {
            console.log("Solr not initialized! Sync action 'add' canceled!");
            typeof fn == "function" && fn();
            return;
        }

        ++requests;
        var solrDoc = getSolrDocByThing(thing);
        loadDecksDataToSolrDoc(solrDoc, function (docs) {
            addSolrDoc(docs, fn);
        });
    };

    function getSolrDocByThing(thing) {
        return {
            _id: thing._id,
            title: thing.title ? thing.title : "",
            description: thing.description ? thing.description : "",
            visible: thing.visible ? true : false,
            createdAt: solr.convertDate(thing.createdAt),
            updatedAt: solr.convertDate(thing.updatedAt),
            tags: thing.tags || [],
            decks: thing.decks || []
        };
    }

    function loadDecksDataToSolrDoc(solrDoc, fn) {
        Deck.find({things: solrDoc._id}).run(function (err, decks) {
            var decksNames = [];
            var decksTags = [];
            for (var i in decks) {
                decksNames.push(decks[i].name);
                decksTags = decksTags.concat(decks[i].tags);
           }
            solrDoc.decks = decksNames;
            solrDoc.tags = solrDoc.tags.concat(decksTags);
            if (typeof fn == 'function') fn(solrDoc);
        });
    }

    function addSolrDoc(solrDoc, fn) {
        solr.add(solrDoc, function (err) {
            --requests;
            if (err) console.log('Solr error: ' + err.message);
            commitSolr(fn);
        });
    }

    function commitSolr(fn) {
        if (requests == 0) {
            solr.commit();
            if (typeof fn == 'function') fn();
        }
    }
}