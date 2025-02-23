var utils = require('util');
var _     = require('lodash');

module.exports = {

    middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin',      '*');
        res.setHeader('Access-Control-Allow-Methods',     'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers',     'X-Requested-With,content-type,Authorization');
        res.setHeader('Access-Control-Allow-Credentials', true);
        next();
    },

    redirect: function(req, res, next) {
        if (req.path.substr(-1) == '/' && req.path.length > 1) {
            var query = req.url.slice(req.path.length);
            res.redirect(301, req.path.slice(0, -1) + query);
        } else {
            next();
        }
    },
}
