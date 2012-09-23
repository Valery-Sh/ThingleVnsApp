var errors = module.exports = require(global.approot + '/resources/errors');


module.exports.handler = function(err, req, res, next) {   
    
    for (var i in errors) {
        if (err instanceof errors[i]) {
            res.send({error: err.message}, err.status);
            return;
        }
    }
    
    if (err instanceof Error) {
        console.error(err.stack);
        res.send({error: 'Internal Server Error'}, 500);
        return;
    } 
    
    next(err);
};