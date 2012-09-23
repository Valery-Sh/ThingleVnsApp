var filters = require(global.approot + '/resources/filters'),
    Thing = require(global.approot + '/models/thing'),
    SolrSync = require(global.approot + '/models/plugins/solr-sync');

module.exports = {
    sync:[
        filters.admin,
        function (req, res, next) {
            res.send({
                data:"Solr sync was started.",
                success:true
            });

            console.log("Solr sync was started.");
            var portion_limit = 1000,
                current_offset = 0,
                sync = new SolrSync();

            sync.remove(syncPortion);

            function syncPortion() {
                Thing.find().skip(current_offset).limit(portion_limit).run(function (err, docs) {
                    if (err) return console.log(err.message);
                    current_offset += portion_limit;
                    if (docs.length > 0) sync.addCollection(docs, syncPortion);
                    else console.log("Solr sync was finished.");
                });
            }
        }
    ]
};