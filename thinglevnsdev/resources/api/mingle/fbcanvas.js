/** 
 * Currently implemented as method on the mingle api controller
 * The way routes can be best manipulated is still a bit of a mystery to me
 */ 
 
 /** 
  * TODO: resources/mingle.js FB Canvas specific logic should be moved here
  */
var filters = require(global.approot + '/resources/filters'),
    errors = require('../errors.js'),
    appUrl = "http://localhost:8080/" + "#profile/friends/things";


module.exports = {
    index: [
      function(req,res,next){
        res.send('fbcanvas index');
        console.log(req);
        
      }
      ],
    create: [
//        filters.auth,
//        loadUser,
//        fbParseRequestObjectResponse,
        function(req, res, next) {
          console.log(req);
          res.send(
            '<html><head><script type="text/javascript">top.location="'+
            appUrl +
            '";</script></head></html>)'
            );
        }
    ],
    incoming: 
      [
//        filters.auth,
//        loadUser,
//        fbParseRequestObjectResponse,
        function(req, res, next) {
          console.log(req);
          res.send(
            '<html><head><script type="text/javascript">top.location="'+
            appUrl +
            '";</script></head></html>)'
            );
        }
    ]
      
      
};

function fbParseRequestObjectResponse(req, res, next){
  next();
  
}

function loadUser(req, res, next) {
  next();
    var User = require(global.approot + '/models/user');

    User.findById(req.session.user._id, function(err, doc){
        if (err) next(err);

        resource.user = doc;
        next();
    });
}