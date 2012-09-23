/**
 * This seems to originate from https://github.com/visionmedia/express-resource
 * 
 * But why is it different from the current code there?
 * What has been modified and why?
 */

var app = require('./app'),
    Resource = require('express-resource'),
    resources_path = global.approot + '/resources',
    api_resources_path = global.approot + '/resources/api';


Resource.prototype.__defineSetter__('id', function(param){
    this._id = require('lingo').en.singularize(param);
});
Resource.prototype.__defineGetter__('id', function(){
    return this._id;
});

Resource.prototype.map = function (method, path, fn) {
    var self = this,
        orig = path;

    if (method instanceof Resource) return this.add(method);
    if ('function' == typeof path) fn = path, path = '';
    if ('object' == typeof path) fn = path, path = '';
    if ('/' == path[0]) path = path.substr(1);
    else path = path ? this.param + '/' + path : this.param;
    method = method.toLowerCase();

    // setup route pathname
    var route = this.base + (this.name || '');
    if (this.name && path) route += '/';
    route += path;
    route += '.:format?';

    // register the route so we may later remove it
    (this.routes[method] = this.routes[method] || {})[route] = {
        method:method,
        path:route,
        orig:orig,
        fn:fn
    };

    // apply the route
    var methods = [], fns = [];
    if (fn instanceof Array) fns = fn;
    else fns = [fn];

    var action = fns.pop;
    fns.push(function (req, res, next) {
        req.format = req.params.format || req.format || self.format;
        if (req.format) res.contentType(req.format);
        if ('object' == typeof action) {
            if (req.format && action[req.format]) {
                action[req.format](req, res, next);
            }
            else if (action['default']) {
                action['default'](req, res, next);
            }
        else
            {
                res.send(406);
            }
        }
        else {
            action(req, res, next);
        }
    });


    this.app[method](route, fns);

    return this;
};

Resource.prototype.add = function (resource, to_collection) {
    var app = this.app
        , routes
        , route;

    // relative base
    resource.base = this.base
        + (this.name ? this.name + '/' : '')
        + (to_collection ? '' : this.param + '/');

    // re-define previous actions
    for (var method in resource.routes) {
        routes = resource.routes[method];
        for (var key in routes) {
            route = routes[key];
            delete routes[key];
            app[method](key).remove();
            resource.map(route.method, route.orig, route.fn);
        }
    }

    return this;
};

Resource.prototype.add_sub_resource = function (name, to_collection, cb) {
    if (typeof to_collection == 'function') {
        cb = to_collection;
        to_collection = false;
    }

    var methods = require(resources_path + '/' + this.name + '/' + name),
        sub_resource = app.resource(name, methods, {id: this.id + '_' + name}),
        resource = this.add(sub_resource, to_collection);

    delete app.resources[name];
    app.resources[this.name + '_' + name] = sub_resource;

    if (typeof cb == 'function') cb(sub_resource, methods);

    return resource;
};

module.exports = {

    api_resources:function (resource_name, map) {
        var resource_methods = require(api_resources_path + '/' + resource_name),
            resource = app.resource('api/' + resource_name, resource_methods, {format:'json'});

        if (map instanceof Object) {
            for (var fn in map) {
                var method = map[fn],
                    verb = method,
                    action = fn.replace(/\//g, '');

                if (method instanceof Object) {
                    verb = method.verb;
                    action = method.action;
                }

                resource.map(verb, fn, resource_methods[action]);
            }
        }

        return resource;
    },

    api_resource:function (resource_name, map) {
        if (typeof(map) == 'undefined') map = {};

        map['/'] = {verb:'get', action:'show'};

        return this.api_resources(resource_name, map);
    },

    method:function (verb, path) {
        var method = path.match(/[^\/]+$/)[0],
            resource_path = path.replace(/\/?[^\/]+$/, ''),
            resource = require(resources_path + '/' + resource_path);

        return app[verb]('/' + path, resource[method]);
    },
    
    route:function (verb, path, resourcePath, method) {
        // simple express routing wrapper
        var resource = require(resources_path + '/' + resourcePath);
        return app[verb](path, resource[method]);
    }
}
