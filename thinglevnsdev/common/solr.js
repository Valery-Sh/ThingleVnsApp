var options = global.config.solr;
var solr_client = null;

if (options) {
    if (typeof options == "string") {
        var matches = /^(\w+:\/\/)?([\w\.]+)(:(\d+))?(\/[\w\./]*)?$/.exec(options);
        options = {
            host:matches[2],
            port:matches[4] || 80,
            path:matches[5].replace(/(\/)*$/, '')
        }
    }

    solr_client = require(global.approot + '/plugins/gsf-node').createClient(options);

    solr_client.convertDate = function(d) {
        return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate() + 'T'
            + d.getUTCHours() + ':' + d.getUTCMinutes() + ':' + d.getUTCSeconds() + "Z";
    }
} else {
    console.log("Solr not initialized");
}

module.exports = solr_client;