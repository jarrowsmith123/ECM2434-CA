module.exports = function(app, security, settings, errorHandler) {
    return new Routing(app, security, settings, errorHandler);
}

var _ = require('lodash'),
        changeCase = require('change-case');
Validation = require('validator-framework'),
        rfUtils = require('./utils'),
        rfErrors = require('./error'),
        Promise = require('bluebird');

        securityFramework = require('security-framework');


var Routing = function(app, security, settings, errorHandler) {
    this.app = app;
    this.security = security;
    this.settings = _.extend({
        pathControllers: process.cwd() + '/controllers'
    }, settings);
    this.controllers = {};

    if(errorHandler == null) {
        errorHandler = rfErrors({
            debug: settings != undefined && settings.debug != undefined ? settings.debug : false
        });
    }


    defaultSecurity = securityFramework.Security({
        methods: {
            oauth: {
                config: {
                    endpoint: "http://127.0.0.1:3000/me"
                }
            },
            http: {
                config: {
                    realm: 'Evibe Private Api',
                    user: 'admin',
                    password: 'private'
                }
            }
        },
        rules: {
            guest: {
                methods: ['guest']
            },
            user: {
                methods: ['oauth', 'http']
            }
        }
    })

    this.security = defaultSecurity;

    if(security != null) {
        this.security = _.merge(this.security, security);
        this.security.registerMiddlewaresFromPath(security.pathMiddlewares);
        this.security.validate();
    }

    this.errorHandler = errorHandler;
    this.traceRouteLoaded = [];

    return this;
}

Routing.prototype.loadController = function(name, config) {

    var controller = require(this.settings.pathControllers + '/' + name)(this.app, config);
    this.controllers[(name.toLowerCase())] = controller;

    return controller;
}


Routing.prototype.loadRoute = function(method, route, security, controller, validator) {

    var debug = "[+] " + method + " " + route + (validator ? " (validation)" : "");
    this.traceRouteLoaded.push(debug);
    
    if (process.argv[2] && process.argv[2] == 'debug-route') {
        console.log(debug);
    }

    var args = [route, this.security.getSecurityMiddleware(security)];
    var m;
    switch (method.toLowerCase()) {
        case 'all':
            m = this.app.all;
            break;
        case 'get':
            m = this.app.get;
            break;
        case 'post':
            m = this.app.post;
            break;
        case 'delete':
            m = this.app.delete;
            break;
        case 'patch':
            m = this.app.patch;
            break;
        default:
            debug = "Method not allowed: " + method;
            this.traceRouteLoaded.push(debug);
            if (process.argv[2] && process.argv[2] == 'debug-route') {
                console.log(debug);
            }
            
            return;
    }

    if (_.isFunction(controller)) {
        args.push(controller);
    } else {
        var methods = this.resolveControllerValidation(controller);
        var wrapperController = new WrapperController(this.errorHandler, methods);

        if (methods.validation) {
            args.push(wrapperController.handleRequestValidation());
        }
        args.push(wrapperController.handleRequest());
    }
    m.apply(this.app, args);

    return this;
}

WrapperController = function(errorHandler, methods) {
    this.methods = methods;
    this.errorHandler = errorHandler;

    return this;
}

WrapperController.prototype.handleRequestValidation = function() {
    var self = this;

    return function(req, res, next) {
        var handlerResult = self.methods['validation'].apply(self.methods['controller'], [req, res]);
        if (_.isObject(handlerResult)) {
            handlerResult = Promise.resolve(handlerResult);
        } else if (!rfUtils.isPromise(handlerResult)) {
            throw new Error("baby :)");
        }

        handlerResult.then(function(validations) {
            var promises = [];
            _.each(validations, function(validation) {
                var applyOn = validation.on;
                var groups = validation.groups;
                if (groups && !_.isArray(groups)) {
                    groups = [groups];
                }
                var rules = validation.rules;
                promises.push(self.getPromiseValidation(req[applyOn] || {}, rules, groups, applyOn));
            });
            if (promises.length == 0) {
                next();
            }

            Promise.settle(promises)
                    .then(function(results) {
                        var errors = [];
                        _.each(results, function(promiseResult) {
                            if (promiseResult.isRejected()) {
                                errors.push(promiseResult.reason());
                            }

                            if(promiseResult.isFulfilled()){
                                var data = promiseResult.value();
                                if(req.validatedValues == undefined) {

                                    var ValidatedValueHelper = function() {
                                    }

                                    ValidatedValueHelper.prototype.getFieldValue = function(field, domain) {

                                        var domains = ["_params", "_body", "_query"];

                                        if(domain != undefined && !_.contains(domains, domain)) {
                                            throw new Error("invalid domain values");
                                        }
                                        
                                        if(domain != undefined) {
                                            domains = [domain]
                                        }

                                        for(var i =0; i < domains.length; i++) {
                                            var domain = domains[i];
                                            
                                            var result = _.find(this[domain], function(key) {
                                                if (key.field === field) {
                                                    return true;
                                                }
                                            });

                                            if (result) {
                                                return result.value;
                                            }
                                        }
                                    }

                                    ValidatedValueHelper.prototype.set = function (domain, values) {
                                        var self = this;

                                        switch(domain) {
                                            case 'params':
                                            case 'body':
                                            case 'query':
                                                self["_"+domain] = values;
                                                return;

                                            default:
                                                throw new Error("invalid domain values");
                                                return;
                                        }
                                    }

                                    ValidatedValueHelper.prototype.params = function (key) {
                                         return this.getFieldValue(key, "_params");
                                    }

                                    ValidatedValueHelper.prototype.query = function (key) {
                                         return this.getFieldValue(key, "_query");
                                    }

                                    ValidatedValueHelper.prototype.body = function (key) {
                                         return this.getFieldValue(key, "_body");
                                    }
                                    
                                    req.validatedValues = new ValidatedValueHelper();
                                }

                                req.validatedValues.set(data["applyOn"], data.validatedValue); 
                            }
                        });
                        if (errors.length > 0) { 
                            if (self.methods.validationErrorHandler) {
                                var handlerResult = self.methods['validationErrorHandler'].apply(self.methods['controller'], [errors, req, res]);
                                return self.errorHandler.handleError(handlerResult, req, res, next);
                            } else {
                                return self.sendValidationErrors(req, res, errors, next);
                            }
                        } else {
                            next();
                        }
                    });
        });
    }
}

WrapperController.prototype.getPromiseValidation = function(data, rules, groups, applyOn) {

    return new Promise(function(resolve, reject) {
        return Validation.ObjectValidator(rules)
                .validate(data, {groups: groups}).then(function(result) {
            return resolve({validatedValue: result, applyOn: applyOn});
        }).catch(function(error) {
            error.applyOn = applyOn;
            return reject(error);
        })
    });
}

WrapperController.prototype.sendValidationErrors = function(req, res, errors, next) {
    return this.errorHandler.handleError(new handler.prototype.ValidationParametersError(errors), req, res, next);
}

WrapperController.prototype.handleRequest = function() {

    var self = this;
    return function(req, res, next) {

        try {
            var handler = self.methods['action'].apply(self.methods['controller'], [req, res]);

            if (rfUtils.isPromise(handler)) {

                handler.then(function(jsonResult) {
 
                    if (typeof jsonResult == "object") {
                        res.status(200).json(jsonResult);
                    } else if (typeof jsonResult == "string") {
                        res.status(200).json(jsonResult);
                    }
                    else if (typeof jsonResult == "function") {
                        return jsonResult(req, res);
                    } else {
                        var e = new Error("INTERNAL_ERROR");
                        e.details = 'your promise must return an function(req, res) or object/string';
                        throw e;
                    }

                }).catch(function(e) {
                    // promise failed
                    return self.errorHandler.handleError(e, req, res, next);
                });

            } else if (typeof handler == "object") {
                res.status(200).json(handler);
            } else if (typeof handler == "function") {
                return handler(req, res);
            } else if (typeof handler == "string") {
                return res.json(handler);
            } else {
                var e = new Error("INTERNAL_ERROR");
                throw e;
            }

        } catch (e) {
            // catch for non promise return
            return self.errorHandler.handleError(e, req, res, next);
        }
    }
};

Routing.prototype.resolveControllerValidation = function(controllerName) {
    var parts = controllerName.split('/');
    if (parts.length != 2) {
        throw new Error("Error resolving " + controllerName);
        return;
    }

    var controller = parts[0].toLowerCase();
    var action = parts[1];
    var methodAction = 'get' + changeCase.upperCaseFirst(action) + 'Action';
    var methodValidation = 'get' + changeCase.upperCaseFirst(action) + 'Validation';
    var methodValidationErrorHandler = 'get' + changeCase.upperCaseFirst(action) + 'ValidationErrorHandler';
    var validation = undefined;
    var validationErrorHandler = undefined;

    if (!_.has(this.controllers, controller)) {
        throw new Error("Controller not found : " + controller);
    }

    if (!_.isFunction(this.controllers[controller][methodAction])) {
        throw new Error("Method not found : " + methodAction + " on controller " + controller);
    }

    if (_.isFunction(this.controllers[controller][methodValidation])) {
        validation = this.controllers[controller][methodValidation];
    }


    if (_.isFunction(this.controllers[controller][methodValidationErrorHandler])) {
        validationErrorHandler = this.controllers[controller][methodValidationErrorHandler];
    }

    return {controller: this.controllers[controller], action: this.controllers[controller][methodAction], validation: validation, validationErrorHandler: validationErrorHandler};
}
