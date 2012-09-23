define({
    chooseFromURL: function(url, cb, ready_cb) {
        requirejs.undef('bookmarklet/snippet');
        delete window.__pinEngine;

        var $iframe = $('<iframe />'),
            iframe_url = '/proxy?url=' + encodeURIComponent(url);
        $iframe.attr({src: iframe_url, width: 0, height: 0}).appendTo('body');


        var $img = $('<img />');
        $img.attr({src: url});
        $img.load(function() {
            $iframe.remove();
            if (window.__pinEngine) {
                window.__pinEngine.onClose();
                delete window.__pinEngine;
            }

            if (typeof ready_cb == 'function') ready_cb();
            cb($img.attr('src'));
        });


        $iframe.load(function(){
            if (typeof ready_cb == 'function') ready_cb();

            var _cb = cb;
            cb = function () {
                $iframe.remove();
                if (typeof _cb == 'function') _cb.apply(this, arguments);
            }

            var iframe_doc = this.contentWindow.document
            window.Thingle = {
                document: iframe_doc,
                callback: cb
            };

            var iframe_url_root = url.match(/^\w+:\/\/[^\/]+/)[0];
            $('img:not([src^="http:"]):not([src^="https:"]):not([src^="data:"])', iframe_doc).each(function(){
                var src = $(this).attr('src');
                $(this).attr('src', iframe_url_root + '/' + src);
            });

            require(['bookmarklet/snippet']);
        });



    }
});