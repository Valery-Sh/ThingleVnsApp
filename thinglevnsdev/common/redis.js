function redisConnect() {
    var redis_url = require('url').parse(global.config.redis),
        redis_client = require('redis').createClient(redis_url.port, redis_url.hostname);

    if (redis_url.auth) redis_client.auth(redis_url.auth.split(":")[1]);

    return redis_client;
}

require('kue').redis.createClient = redisConnect;

module.exports = redisConnect();