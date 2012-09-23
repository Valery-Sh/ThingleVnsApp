module.exports = {
    port:8080,
    build: false,
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
    mongodb:'mongodb://localhost:27017/thingle',
//    mongodb: "mongodb://thingle:jql805j1jqhdk3rslm7vm81i04@ds033317.mongolab.com:33317/heroku_app4604847", // staging
    facebook:{
        app_id:"373183032716207",
        secret:"b98cf20d5cec423d94191ca002e6f9a4"
    },
    redis:"redis://localhost:6379/",
    /*
    solr:{
        host:'127.0.0.1',
        port:'8080',
        path:'/solrdev' // should also begin with a slash
    }
    */
    // or solr: "http://solr.url:port/path"
};
