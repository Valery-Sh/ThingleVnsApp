module.exports = function(env) {
    var config = require('./env/' + env);
    config.env = env;
    return config;
};