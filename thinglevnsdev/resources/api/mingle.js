var filters = require(global.approot + '/resources/filters'),
    User = require(global.approot + '/models/user'),
    UserSession = require(global.approot + '/models/user-session'),
    Mingle = require(global.approot + '/models/mingle'),
    fbInvite = require(global.approot + '/models/mingle/fb-invite').model,
    errors = require('./errors.js');

var Controller = function() {
    var self = this;

    self.defaultLimit = 10;

    self.index = [
      filters.auth,
      function(req, res, next) {
      var limit = req.param("limit", this.defaultLimit) * -1,
          offset = req.param("offset", 0);

      fbInvite.find({
        "from_user": req.session.user._id
      }).limit(limit).skip(offset).run(

      function(err, docs) {
        if (!docs) {
          next(new errors.NotFound());
        } else {
          res.send(docs);
        }
      });
    }];

    self.create = [
      filters.auth,
      function(req, res, next) {
      self.load(req.body.userId, function(err, doc, next) {
        if (!doc) return next(new errors.NotFound());

        if (req.user.followings.indexOf(doc._id) < 0) {
          req.user.followings.push(doc._id);
          req.user.save(function(err, user) {
            if (err) console.log(err);
            else req.session.user.followings = user.followings;
          });
        }

        res.send(doc);
      });
    }
    ];

    self.destroy = [
      filters.auth,
      function(req, res, next) {
      var followerIndex = req.user.followings.indexOf(req.following._id);
      if (followerIndex < 0) return next(new errors.NotFound());
      req.user.followings.splice(followerIndex, 1);
      req.user.save(function(err, user) {
        if (err) console.log(err);
        else req.session.user.followings = user.followings;
      });
      res.send(req.following);
    }
    ];

    /**
     * When a user navigates to the FaceBook Canvas App 
     * a POST to this handle is sent.
     * 
     * The context of the navigation is sent along as query params.
     * We should likely be mapping out the possible states.
     * We will likely need and want to keep track of contexts and react accordingly.
     */
    self.fbcanvaspost = [
      function(req, res, next) {
        //NOTE: fb_source seems to change value depending on how the user interacts on facebook ie, Home vs Apps vs notification icon  
        if (req.param('fb_source') != 'request') return next();
  
        var fb = require(global.approot + '/common/facebook'),
            redis = require(global.approot + '/common/redis'),
            async = require('async');
  
        /** Please document what the intention and mechanism is here */
        async.waterfall([
          function(cb) {
          redis.get('fb_app_token', cb);
        },
          function(token, cb) {
          fb.getSessionByAccessToken(token)(function(session) {
            cb(null, session);
          });
        },
          function(fb_session, cb) {
          fb_session.graphCall('/' + req.param('request_ids'))(cb);
        }
        ], function(result) {
          /**
           * FIXME: ReqObj data payload should be consumed with care.
           *        It is likely we will find a fair number of uses for the data payload.
           * 
           * This is a dirty hack, ideally we would json.stringify({route: "some/app/route"})
           */
          if (result.data && !result.data.indexOf("invite")) {
            req.params.redirect = '#' + result.data;
          }
  
          next();
        });
      },
      /** Middleware - to be - which extracts and normalizes signed requests from FB */
      function(req, res, next) {
      req.sigReqObj = null;
      if (req.body && req.body.signed_request) {
        req.sigReqObj = self.fbParseSignedRequest(req.body.signed_request);
      } else {
        console.log('No signed request in POST Body');
        console.log(req.body);
      }
      console.log('calling fbHandleFulfilledRequests');
      next();
    },
      /** Middleware - to be - which handles FB requestObject housekeeping */
      fbHandleFulfilledRequests,
      function(req, res, next) {
      var relUrl = req.param('redirect') || "#",
          appUrl = "http://" + req.headers.host + relUrl,
          jsRedir = '<html><head><script type="text/javascript">top.location="'
            + appUrl + '";</script></head></html>';
            
      if (req.sigReqObj) {
        if (req.sigReqObj.oauth_token) {
          UserSession.auth(
          req.sigReqObj.oauth_token, req.session, function(err, user) {
            console.log(user);
            res.send(jsRedir);
          });
        } else {
          console.log('got signed request but no oauth_token could be had');
          console.log(req.body);
          res.send(jsRedir);
        }
      } else {
        res.send(jsRedir);
      }

    }
    ];

    /**
     * Sample output from accepting invite
     * https://developers.facebook.com/tools/echo?signed_request=r4TiwXmgSnuZ90g2xU0Bcwdx0kjT5_iMTwZu-Nd2_Qk.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjEzNDM2MDY0MDAsImlzc3VlZF9hdCI6MTM0MzU5OTQ1Niwib2F1dGhfdG9rZW4iOiJBQUFFeHNxM0x4WkJzQkFQQ3paQzVxNU9PWGFaQXY0ajZ4b2cwZlhlUlZaQ0dCdTdiRVAyWkFtWkFhSDRvTW16WkFuQ0VPMjFRZVc3MGVvTVAweUtZOUpuak9zSW40UWFpRkNaQUtLNmN2dVRMOENsOFdkdHdQTEhNIiwidXNlciI6eyJjb3VudHJ5IjoidGgiLCJsb2NhbGUiOiJlbl9VUyIsImFnZSI6eyJtaW4iOjIxfX0sInVzZXJfaWQiOiIxMDAwMDQwNzczNTI1OTcifQ
     * Contains oauth_token
     */
    self.fbParseSignedRequest = function(sr) {
      var payload = sr.split('.')[1],
          payloadun64 = new Buffer(payload.replace(/\-/g, '+').replace(/\_/g, '/'), 'base64').toString('binary'),
          sigReqObj = JSON.parse(payloadun64);

      return sigReqObj;
    };

    /**
     * Sample URL on Invite accept:
     * http://apps.facebook.com/nearherein/?fb_source=notification&request_ids=331744700253185&ref=notif&app_request_type=user_to_user&notif_t=app_request
     */
    /** Currently assume we are dealing with friends invite */

    function fbHandleFulfilledRequests(req, res, next) {
      console.log('handlefulfilled start');
      var reqIds = req.param('request_ids'),
          incUserId = req.sigReqObj.user_id,
          reqIdsArr, req_instance;


      if (incUserId && reqIds) {
        var fb = require(global.approot + '/common/facebook'),
            redis = require(global.approot + '/common/redis');

        reqIdsArr = reqIds.split(',');
        reqIdsArr.forEach(function(reqId) {
          if(!reqId){ return;}
          req_instance = reqId + "_" + incUserId;
          console.log(req_instance);
          redis.get('fb_app_token', function(app_token){
            fb.getSessionByAccessToken(app_token)(function(fbsession) { /** Delete ReqObject in FB */
              fbsession.graphCall('/' + req_instance, {}, 'DELETE')(function() {
                console.log('graphCall Delete request instance');
                console.log(arguments);
                User.update({
                  "invites.request_id_instance": req_instance
                }, {
                  $set: {
                    "invites.$.request_deleted": true,
                    "invites.$.request_accepted": true
                  }
                }, false, true);
              });
            });
          });
        });
      }
      next();

    };

    self.load = function(id, fn) {
      User.findById(id, function(err, doc) {
        if (!doc) fn(new errors.NotFound);
        else fn(null, doc);
      });
    };
    }
    
    
    
    
module.exports = new Controller();