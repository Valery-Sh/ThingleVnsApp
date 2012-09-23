module.exports = {
    proxy: function(req, res) {
        var url = req.param('url');

        if (!url) {
            return res.send("");
        }

        var request = require('request'),
            urlOptions = require('url').parse(url),
            stream = require('stream'),
            util = require('util');

        function ReplaceStream() {
            this.on('data', function(data){res.write(data)});

            this.on('end', function(data){res.end(data); });
            this.writable = true;
        }

        util.inherits(ReplaceStream, stream.Stream);

        ReplaceStream.prototype.write = function(chunk) {
            var baseUrl = urlOptions.protocol + '//' + urlOptions.host + '/'
            chunk = chunk.toString().replace(/\<head[^\>]*\>/, '$&<base href="' + baseUrl + '" />');
            this.emit('data', chunk);
        };

         ReplaceStream.prototype.end = function(chunk) {
//             if (chunk) this.write(chunk);
             this.emit('end', chunk);
         };

        var replaceStream = new ReplaceStream();

        request(url).pipe(replaceStream);
    }
};