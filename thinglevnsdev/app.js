global.approot = __dirname;

// Create server
var app = require(global.approot + '/common/app');

// Routing
require(global.approot + '/config/routes');


//Start server
if (!module.parent) {
    app.listen(global.config.port);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}