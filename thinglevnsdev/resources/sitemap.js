var moment = require('moment');
var Thing = require(global.approot + '/models/thing');
var Deck = require(global.approot + '/models/deck')
var sitemapPattern = /sitemap-(\w+)-([0-9-]+)\.xml$/;

var options = {
    initialDate : "01-06-2012",
    types : {
        things : {},
        decks : {
            initialDate : "01-09-2012"
        }
    }
}

function sitemapIndexToXml(data) {
    var xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml = xml + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    for ( var i = 0; i < data.length; i++) {
        xml = xml + '<sitemap>';
        xml = xml + '<loc>' + data[i].loc + '</loc>';
        xml = xml + '</sitemap>';
    }
    xml = xml + '</sitemapindex>';
    return xml;
}

function sitemapToXml(data) {
    var xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml = xml + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    for ( var i = 0; i < data.length; i++) {
        xml = xml + '<url>';
        xml = xml + '<loc>' + data[i].loc + '</loc>';
        xml = xml + '<lastmod>' + data[i].lastModified + '</lastmod>';
        xml = xml + '</url>';
    }
    xml = xml + '</urlset>';
    return xml;
}

module.exports = {
    index : function(req, res) {
        // generate on sitemap entry per type and month since the initalDate,
        // regardless of what the DB contains
        var host = req.header('host');
        var date = moment.utc(options.initialDate, "DD-MM-YYYY");
        var now = moment.utc();

        var sitemapIndex = new Array();
        while (now.diff(date) > 0) {
            for ( var type in options.types) {
                var typeOptions = options.types[type];
                if (!typeOptions.initialDate
                        || date.diff(moment.utc(typeOptions.initialDate, "DD-MM-YYYY")) >= 0) {
                    sitemapIndex.push({
                        loc : "http://" + host + "/sitemap-" + type + "-" + date.format("MM-YYYY")
                                + ".xml"
                    });
                }
            }
            // increment date
            date.add("M", 1);
        }

        res.end(sitemapIndexToXml(sitemapIndex));
    },
    sitemap : function(req, res) {
        // Generate a url entry for each document matching the given type and
        // created during the given month
        var matcher = sitemapPattern.exec(req.url);
        if (!matcher || !options.types[matcher[1]]) {
            res.statusCode = "404";
            res.end();
            return;
        }

        var host = req.header('host');
        var type = matcher[1];
        var startDate = moment.utc(matcher[2], "MM-YYYY");
        var endDate = moment.utc(startDate).add("M", 1);

        var query = null;
        if (type == "things") {
            // only visible things
            query = Thing.visible();
        } else if (type == "decks") {
            // only non empty collections
            query = Deck.find({
                "things" : {
                    $ne : []
                }
            });
        }

        query.where("createdAt").gte(startDate.toDate());
        query.where("createdAt").lt(endDate.toDate());
        query.select("_id updatedAt");

        query.run(function(err, docs) {
            var sitemap = new Array();
            for ( var i = 0; i < docs.length; i++) {
                sitemap.push({
                    loc : "http://" + host + "/#!" + type + "/" + docs[i].get("_id"),
                    lastModified : moment(docs[i].get("updatedAt")).format("YYYY-MM-DD")
                });
            }

            res.end(sitemapToXml(sitemap));
        });
    }
};