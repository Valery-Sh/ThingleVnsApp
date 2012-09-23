define(function(require) {

    // nested view. The parent view has to define the 'el'
    return Backbone.View.extend({

        render : function() {

            var self = this;
            var origin = document.location.protocol + "//"
                    + document.location.host;
            var jsUrl = origin + "/js/bookmarklet/snippet.js";
            var href = "javascript:(function(){ "
                    + "var tag = document.createElement(\"script\");"
                    + "tag.setAttribute(\"type\", \"text/javascript\");"
                    + "tag.innerHTML = ' var Thingle = {host: \""
                    + document.location.host + "\"}; '; "
                    + "document.body.appendChild(tag);"
                    + "tag = document.createElement(\"script\");"
                    + "tag.setAttribute(\"type\", \"text/javascript\");"
                    + "tag.setAttribute(\"src\", \"" + jsUrl + "\");"
                    + "document.body.appendChild(tag);" + "})();";

            self.$el.attr("href", href);
            self.$el.attr("onclick",
                    "alert('Drag me to bookmarks!');return false;");
        }

    });
});