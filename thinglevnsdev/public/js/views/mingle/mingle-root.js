define(function (require) {
    var html = require('text!tpl/mingle/mingle.html'),
        titleView = new (require('views/title'));

    return Backbone.View.extend({
        auth:true,
        template:_.template(html),
        renderQ:[],
        viewStack:[],
        title_txt:"Mingle on Thingle",
        currentSubPath:null,
        events:{
            'click nav a':'_navigate'
        },

        initialize:function (params) {
            var self = this;
            console.log(params);
            if (params && params.path) {
                self.renderQ.push(params);
            }
        },

        undelegateEvents:function () {
            return this.invokeViews('undelegateEvents');
        },

        delegateEvents:function () {
            return this.invokeViews('delegateEvents');
        },

        destroy:function () {
            return this.invokeViews('destroy');
        },

        //Sadly _.invoke doesn't allow checking
        invokeViews:function (fnN, args) {
            _.each(this.viewStack, function (v) {
                v && _.isFunction(v[fnN]) && v[fnN](args);
            });
            return this;
        },

        render:function () {
            var self = this, sub;
            this.$el.append(this.template());
            App.currentView = self;

            titleView.render(self.title_txt);
            while (sub = self.renderQ.shift()) {
                // Ideally I think we would like to be able to inspect
                // the *instantiated* view. Currently we don't seem to be able to
                self.currentSubPath = self._renderSubPath(sub);
            }
            return this;

        },
        _renderSubPath:function (params) {
            if (!params || !params.path) {
                return false;
            }
            var self = this;
            console.log('Render subPath');
            console.log(params);
            params.el = params.el || self.$el.find('.page-content');
            params.parentView = self;

            //App.view doesn't return anything at the moment,
            //but it might be nice if it did
            return App.view(params.path, params);
        },
        _navigate:function (evt) {
            var $content = $('#content'),
                $nav = $('#mingle-nav'),
                path = $(evt.target).prop('hash').replace('#', '');

            console.log(evt);

            $nav.find('li').removeClass('active');
            $(evt.target).parent().addClass('active');

            this._renderSubPath({
                path:path,
                el:this.$el.find('.page-content')
            });
        },
        /**
         * small ui helper for a highlight effect
         * quick and dirty for testing
         */
        highlight:function (el) {
            el.css('background-color', "#63A2D5");
            el.animate({
                opacity:0
            }, 1000, function () {
                el.removeAttr('style');
            });
        }
    });
});