var FacebookClient = require('facebook-client').FacebookClient,
    redis = require('./redis');

var fb_client = module.exports = new FacebookClient(
  global.config.facebook.app_id, global.config.facebook.secret);


redis.get('fb_app_token', function(err, token){
  //If it isn't null, is it guaranteed that it is valid?
  //Also, what is the downside to caching it on the fb_client obj?
  //Update: It almost looks like APP sessions and User sessions are being conflated?
    if (token != null){ /**fb_client.app_token = token; */ return;}
    fb_client.getAccessToken({grant_type: 'client_credentials'})(function(new_token){
        redis.set('fb_app_token', new_token);
        /**fb_client.app_token = new_token;*/
    });
});

