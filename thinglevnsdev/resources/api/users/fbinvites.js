/**
 * TODO: Most of this should likely be moved out into resources/mingle/*
 */

var filters = require(global.approot + '/resources/filters'),
    errors = require('../errors.js');

var resource = module.exports = {

    index: [
      filters.auth,
      loadUser, //For now we only allow to see ones own invitees.
      function(req, res, next){
        console.log(resource);
        var docs = resource.user.invites;
        if (! docs ){
          next(new errors.NotFound());
        } else {
          res.send(docs);
        }
      }],

    create: [
        filters.auth,
        loadUser,
        fbParseRequestObjectResponse,
        function(req, res, next) {
            if (resource.reqArr){
              resource.reqArr.forEach(function(reqObj){
                resource.user.invites.push(reqObj);
              });
              console.info('saving user invites:');
              console.info(resource.reqArr);
              
              resource.user.save();
              res.send(resource.user.invites);

            } else {
              console.error('No FB requests Array');
              next(new errors.ServerError('No Request Objects Could Be Created'));
            }
        }
    ],

/**
 * NOTE: This is currently handled within the api/mingle/fbcanvas POST route
 * Example: Set Invitation accepted to true and confirm deletion of FB side object:
 * db.users.update({"invites.request_id_instance":"486979954663574_100004057310882"}, 
 *  {$set:{"invites.$.request_deleted":false, "invites.$.request_accepted":false}},false,true)
 * 
 * TODO: 
 * This really really shouldn't be embedded into the user;
 *  A. Narrow use data, 
 *  B. Even if the user ceases to exist the invites would continue to.
 */ 
    destroy: [
        filters.auth,
        loadUser,
        function(req, res) {
            console.log(req);
//            resource.user.closeInvites(req);
            res.send(200);
        }
    ]
};

function fbParseRequestObjectResponse(req, res, next){
  var reqObjId = req.body.fbResp.request, reqArr = [], to = req.body.fbResp.to, reqObj;
  
  if (to && to.length){
    to.forEach(function(v){
      reqObj = {
        request_id: reqObjId,
        to_fbId: v,
        // Getter method? Searching with derived fields?
        request_id_instance: reqObjId + "_" + v
      };
      reqArr.push(reqObj);
    });
    
    resource.reqArr = reqArr;
    next();
    
  } else {
    // How to throw custom errors with stacks etc?
    console.log(req.body);
    next(new errors.NotFound("To field missing in FB Request Object"));
  }
  
}

function loadUser(req, res, next) {
    var User = require(global.approot + '/models/user');

    User.findById(req.session.user._id, function(err, doc){
        if (err) next(err);

        resource.user = doc;
        next();
    });
}