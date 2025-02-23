module.exports = function(settings) {
    return new Security(settings);
}

var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');


/**
 * AuthoriseClient
 *
 */
function Security(settings) {

    //this.settings = settings;
    this.rules = settings.rules;
    this.methods = settings.methods;
    this.settings = settings;
    
    this.allowedMethodNames = [];
    this.validationsForMethod = [];
    this.optionsForMethod = [];
    this.registerDefaultsMiddlewares();
    this.registerMiddlewaresFromPath(settings.pathMiddlewares);

    this.isValidated = false;
    return this;
}

/**
 * Validate configuration
 * @returns {undefined}
 */
Security.prototype.validate = function() {

    var self = this;

    // Verifiy settings
    if (this.methods == undefined || this.rules == undefined) {
        throw new Error("security configuration error, missing methods or rules")
    }

    // Throw error if methods for rules is not found
    self.allowedMethodNames = _.union(self.allowedMethodNames, _.keys(this.methods));

    // register middlewares
    self.registerMiddlewares(this.methods);

    _.each(this.rules, function(rules) {
        var methodRules = rules.methods;

        // First, we check is no new method are not configured for rule
        _.each(methodRules, function(method) {
            if (_.isPlainObject(method)) {

                if(_.keys(method).length > 0) {
                    self.allowedMethodNames = _.union(self.allowedMethodNames, _.keys(method));
                    self.registerMiddlewares(method);
                } else {
                    throw new Error("you must specified key for validation method on rule")
                }
            }
        });

        // Second we check if methods for rules are know
        _.each(methodRules, function(method) {
            if (_.isString(method)) {
                if (!_.contains(self.allowedMethodNames, method)) {
                    throw new Error('"' + method + '"' + " is not a validation method")
                }
            }
        })
    });

    self.isValidated = true;

}

Security.prototype.registerMiddlewares = function(objects) {

    var self = this;
    _.forIn(objects, function(object, key) {

        if (object.extends != undefined) {

            // try to search on default providers with name
            if (self.validationsForMethod[object.extends] != undefined) {

                object.validation = self.validationsForMethod[object.extends];

                var defaultConfig = _.cloneDeep(self.optionsForMethod[object.extends])
                object.config = _.merge(defaultConfig, object.config);

            } else {
                throw new Error("unknow validation method for key " + key)
            }
        }

        // object must have a validation function
        if (object.validation == undefined) {
            // try to search on default providers with name
            if (self.validationsForMethod[key] != undefined) {
                object.validation = self.validationsForMethod[key];
            } else {
                throw new Error("unknow validation method for key " + key)
            }
        }
 
        self.validationsForMethod[key] = object.validation;

        if(self.optionsForMethod[key] != undefined) {
            var defaultConfig = _.cloneDeep(self.optionsForMethod[key])
            object.config = _.merge(defaultConfig, object.config);
        }

        self.optionsForMethod[key] = object.config;
    })
}

Security.prototype.registerDefaultsMiddlewares = function() {
    var self = this;
 
    var normalizedPath = path.join(__dirname, "middlewares");

    fs.readdirSync(normalizedPath).forEach(function(file) {
        var module = require("./middlewares/" + file);
 
        self.validationsForMethod[module.name] = module.middleware;
        self.allowedMethodNames.push(module.name);
        self.optionsForMethod[module.name] = module.config;

    });
}

Security.prototype.registerMiddlewaresFromPath = function(dir) {
    var self = this;

    var paths = [];
    if(_.isString(dir)) {
        paths = [dir];
    } else if (_.isArray(dir)) {
        paths = dir;
    }

    if (paths.length > 0) {
        _.each(paths, function(normalizedPath) {
            try {
                fs.readdirSync(normalizedPath).forEach(function(file) {
                    var p = path.join(normalizedPath, file);
                    var module = require(p);

                    if (module.config != undefined && module.name != undefined && module.middleware != undefined) {

                        self.validationsForMethod[module.name] = module.middleware;
                        self.allowedMethodNames.push(module.name);
                        self.optionsForMethod[module.name] = module.config;

                    } else {
                        throw new Error("invalid middleware at path ", p)
                    }
                });
            } catch (e) {
                throw new Error("Invalid path: '"+ normalizedPath+"'")
            }
        });
    }  
}

Security.prototype.getSecurityMiddleware = function(ruleName) {

    var self = this;
    if(this.isValidated == false) {
        throw new Error("you must validate security configuration");
    }
 
    return function(req, res, next) {

        var rule = self.rules[ruleName];
        if (rule == undefined) {
            throw new Error("invalid rule " + ruleName);
        }

        var methods = rule.methods;
        var mode = rule.methodsMode;

        if (mode == undefined) {
            mode = "or";
        }

        if (!_.contains(["or", "and"], mode)) {
            throw new Error("invalid mode '" + mode + "'");
        }

        var middlewares = [];

        _.each(methods, function(key) {
            if (_.isPlainObject(key)) {

                var method = key;
                _.each(_.keys(method), function(k) {
                    var config = self.optionsForMethod[k];

                    var fn = self.validationsForMethod[k];
                    if(!_.isFunction(fn)) {
                        throw new Error('validation method for key ' + k + ' are not an function')
                    }
                    middlewares.push({
                        fn: fn,
                        args: [config, req, res]
                    });
                });

            } else {
                var config = self.optionsForMethod[key];
                var fn = self.validationsForMethod[key];

                if (!_.isFunction(fn)) {
                    throw new Error('validation method for key ' + key + ' are not an function')
                }
                middlewares.push({
                    fn: fn,
                    args: [config, req, res]
                });
            }
        });

        if (mode == "or") {
            self.handleOrConcurrencyMiddlewares(middlewares, req, res, next);
        } else if (mode == "and") {
            self.handleAndConcurrencyMiddlewares(middlewares, req, res, next);
        }


    }
}

Security.prototype.handleOrConcurrencyMiddlewares = function(middlewares, req, res, next) {
    var self = this;

    var p = _.first(middlewares);
    var promise = p.fn.apply(self, p.args);

    if(!self.isPromise(promise)){
        throw new Error("middleware is not an promise");
    };

    promise.then(function(result) {

        if (req.user != undefined) {
            req.user = _.merge(req.user, result);
        } else {
            req.user = result;
        }

        next();

    }).catch(function(e) {
 
        middlewares = _.rest(middlewares);
        if (middlewares.length == 0) {
            res.json(401, 'Access denied ');
        } else {
            self.handleOrConcurrencyMiddlewares(middlewares, req, res, next);
        }
    })
}

Security.prototype.handleAndConcurrencyMiddlewares = function(middlewares, req, res, next) {
    var self = this;

    var p = _.first(middlewares);
    var promise = p.fn.apply(self, p.args);

    if(!self.isPromise(promise)){
        throw new Error("middleware is not an promise");
    };
    
    promise.then(function(result) {

        if (req.user != undefined) {
            req.user = _.merge(req.user, result);
        } else {
            req.user = result;
        }

        middlewares = _.rest(middlewares);

        if (middlewares.length == 0) {
            next();
        } else {
            self.handleAndConcurrencyMiddlewares(middlewares, req, res, next);
        }

    }).catch(function(e) { 
        res.json(401, 'Access denied ');
    })
}

Security.prototype.isPromise = function(object) {
    return object === Object(object) && typeof object.then === "function";
}
