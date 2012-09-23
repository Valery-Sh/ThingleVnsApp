module.exports = {
    port:process.env.PORT,
    build: true,
    s3:{
        access_key:"AKIAIKFLO67ZVFR6LJUA",
        secret_key:"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",
        bucket:"thingle"
    },
    cloudfront: {
        host: "d2o6adgcyat1se.cloudfront.net",
        image_expire_s: 31556926
    },    
    blitline:{
        app_id:"Vtu5RsXx4UaVVlXCkHYAKQ",
        image_size_map:{
            "small":{
                "width":220,
                "height":5000
            },
            "medium":{
                "width":460,
                "height":5000
            },
            "large":{
                "width":770,
                "height":5000
            }
        }
    },
    sendgrid: {
        username: process.env.SENDGRID_USERNAME,
        password: process.env.SENDGRID_PASSWORD,
        from: 'noreply@thingle.com'
    },
    mongodb:process.env.MONGOLAB_URI,
    facebook:{
        app_id:process.env['FACEBOOK:APP_ID'],
        secret:process.env['FACEBOOK:SECRET']
    },
    redis:process.env.REDISTOGO_URL,
    solr:process.env.WEBSOLR_URL,
    ajax_crawler:"ajaxcrawler.thingle.com"
};
