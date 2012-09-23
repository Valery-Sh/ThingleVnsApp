define(function (require) {
    var helpers = {

        baseURL:document.location.protocol + '//' + document.location.host + document.location.pathname,

        staticURL:function (path) {
            return this.baseURL + '/' + path;
        }
    };


    helpers.ViewHelper = function () {

        this._ensureElement();
        this.delegateEvents();
        this.initialize();

    };

    _.extend(helpers.ViewHelper.prototype, Backbone.View.prototype, {el:'body'});

    helpers.ViewHelper.extend = Backbone.View.extend;


    return helpers;
});
