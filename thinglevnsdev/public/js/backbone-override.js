// //
// Override Backbone.js 0.9.2
// //
define(function() {

    // hashbang support
    // remove '!' from the hash when retrieving the hash fragment
    Backbone.History.prototype.getHash = function(/*window | remove argument as it fails otherwise*/) {
        // start original backbone
        var match = (window || this).location.href.match(/#(.*)$/);
        var hash = match ? match[1] : '';
        // end
        return decodeURIComponent(hash).replace(/^!/, "");
    };

    // hashbang support
    // add '!' to the hash when updating the hash
    Backbone.History.prototype._updateHash = function(location, fragment, replace) {
        fragment = "!" + fragment;
        // start original backbone
        if (replace) {
            location.replace(location.href.replace(/(javascript:|#).*$/, '') + '#' + fragment);
        } else {
            location.hash = fragment;
        }
        // end
    }

    // google analytics support
    // trigger ga event in backbone router
    Backbone.History.prototype.loadUrl = function(fragmentOverride) {
        // start original backbone
        var fragment = this.fragment = this.getFragment(fragmentOverride);
        var matched = _.any(this.handlers, function(handler) {
            if (handler.route.test(fragment)) {
                handler.callback(fragment);
                return true;
            }
        });
        // end

        // track page change
        if (/^\//.test(fragment)) {
            fragment = fragment.slice(1);
        }
        fragment = '/#' + fragment;

        if (window._gaq) {
            window._gaq.push([
                    '_trackPageview', fragment
            ]);
        }
        return matched;
    };
});