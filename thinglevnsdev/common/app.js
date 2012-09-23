/** 
 * 2.
 */
var express = require('express'),
    RedisStore = require('connect-redis')(express),
    userSession = require(global.approot + '/models/user-session').create,
    moment = require('moment'),
    request = require('request');

var app = module.exports = express.createServer();

// Config
global.config = require(global.approot + '/config/config')(app.settings.env);

// Server config
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    app.use(function (req, res, next) {
        // handle google crawling requests
        var fragment = req.query["_escaped_fragment_"];
        if (fragment) {
            // proxy the request to the ajaxcrawler heroku app
            var forwardURL = "http://" + global.config.ajax_crawler + req.url;
            request(forwardURL).pipe(res);
            return;
        }
        next();
    });
    
    if (global.config.build) {
        var maxAgeMs = 2592000000; // one month
        var buildInfo = require(global.approot + '/dist/config/build-info');
        app.use( function(req, res, next){
            var versionPath = '/' + buildInfo.version;
            if (req.url.slice(0, versionPath.length) == versionPath) {
                // version match.
                // remove version from path and set caching header                
                req.url = req.url.slice(versionPath.length);
                res.header('Cache-Control', 'public, max-age=' + maxAgeMs / 1000);
                res.header('Expires', moment.utc().add("ms", maxAgeMs)
                        .format("ddd, DD MMM YYYY HH:mm:ss [GMT]")); 
            } else {
                // resource is not versioned or the version doesn't match
                // prevent caching
                res.header('Cache-Control', 'no-cache');   
            }
            next();
        });
        
        // first lookup resources in the build directory.
        app.use(express.static(global.approot + '/dist/public'));
    }
    
    app.use(express.static(global.approot + '/public'));
    
    app.use(express.cookieParser());

    app.use(express.session({ secret:"ofRqw7TGVSCuozvFQZFKRx6pM2d2sewW", store:new RedisStore({client:require('./redis')}) }));

    app.use(userSession);
    
    app.use(function (req, res, next) {
        app.set('requestedHostname', req.header('host'));

        global.config.currentHostName = 'http://' + app.settings.requestedHostname + "/";

        var imageProcessing = require('./image-processing');
        imageProcessing.postbackURL = 'http://' + app.settings.requestedHostname + '/api/image_postback';
        if (app.settings.env == 'development') {
            imageProcessing.postbackURL = 'http://staging.ideas-implemented.com/dump_request.php';
        }

        var storage = require('./file-storage');
        storage.redirectURL = 'http://' + app.settings.requestedHostname + '/api/image_uploaded';
        next();
    });


    app.use(app.router);

    app.use(require(global.approot + '/resources/api/errors').handler);

    //app.use(express.errorHandler({ dumpExceptions:true }));
});
