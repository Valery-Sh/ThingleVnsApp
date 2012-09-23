(function () {
    function contentHTML(cb) {
        var path = Backbone.history.getHash(),
            fragments = path.split('/');

        if (fragments.length == 1) path += '/index';

        var base_html_path = 'text!tpl/statics/' + fragments[0] + '.html',
            content_html_path = 'text!tpl/statics/' + path + '.html';

        require([base_html_path, content_html_path], cb);
    }

    define(['helpers/html'], function (htmlHelper) {
        
        return Backbone.View.extend({
            id:'static',

            render:function () {
                var self = this,
                    base_page = Backbone.history.getHash()[0];

                contentHTML(function (base_html, content_html) {
                    if (base_page != self.basePage) {
                        self.baseTpl = _.template(base_html);
                        $(self.el).html(self.baseTpl());
                        self.basePage = base_page;
                    }

                    self.contentTpl = _.template(content_html);
                    var $bookmarkletEL = self.$('.static-content').html(self.contentTpl()).find("a#bookmarklet-button");
                    htmlHelper.addBookmarklet($bookmarkletEL);

                    self.$('.static-leftside a[href="#!' + Backbone.history.getHash() + '"]').parents('li').addClass('active');
                });
            }
        });
    });
})();

