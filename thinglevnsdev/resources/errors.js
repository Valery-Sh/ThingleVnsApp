var raise = function(err, msg) {
    err.message = msg;
    Error.call(err, msg);
    Error.captureStackTrace(err, arguments.callee);
};

var errors = module.exports = {
    NotFound: function(msg) {
        if (!msg) msg = 'The document was not found';
        this.status = 404;
        raise(this, msg);
    },
    
    Unauthorized: function(msg) {
        if (!msg) msg = 'Authentication failed';
        this.status = 401;
        raise(this, msg);
    },
    
    ServerError: function(err, msg) {
        if (err) console.error(err.stack);
        if (!msg) msg = 'Internal server error';
        this.status = 500;
        raise(this, msg);
    }
};