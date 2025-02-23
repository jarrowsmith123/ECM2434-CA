(function() {
    var Promise = require('bluebird');
    var _       = require('lodash');
    var util    = require('util');

    var rules      = require('./rules').rules;
    var rulesUtils = require('./rules').utils;

    /**
     * Add custom rules to the rules set
     * @param object _rules array of new rules
     */
    function addRules(_rules) {
        rules = _.merge(rules, _rules);
        return rules;
    }

    /**
     * Default Configuration
     * @type object
     */
    var defaultConfig = {
        errors: {
            messages: {
                required: "The field %%fieldLabel%% is required (default message)",
                invalid:  "The field %%fieldLabel%% is invalid (default message)"
            }
        },
        labelizer:  function(path) { return path + "_super_label_default_config"; }
    };

    /**
     * Given a data object and a path, return the corresponding value
     * @param  object data A data object
     * @param  string path A value path with dot notation
     * @return mixed  Return the value found at path or undefined if value doesn't exists
     */
    function getValueAt(dataObject, path)
    {
        if (_.isUndefined(dataObject)) {
            return undefined;
        }
        if (!_.isString(path)) {
            return dataObject;
        }

        var tokens   = path.split('.');
        var property = tokens[0];
        var subpath  = tokens.slice(1).join('.');
        var data     = dataObject[property];

        if (tokens.length > 1 && !_.isUndefined(data))
        {
            return getValueAt(data, subpath);
        } else {
            return data;
        }
    }

    /**
     * Given 2 lists of groups, return true if the two groups lists share common groups and false otherwise
     * Return the default group if the group value is invalid
     * @param  array groupsConfig The first groups list
     * @param  array wantedGroups The second groups list
     * @return boolean true if groups lists match
     */
    function matchGroups(groupsConfig, wantedGroups)
    {
        var defaultGroups = ['default'];
        var groups = _.map([groupsConfig, wantedGroups], function(grp) {
            if (_.isUndefined(grp)) {
                return defaultGroups;
            } else if (_.isString(grp)) {
                return [grp];
            } else if (_.isArray(grp)) {
                return grp;
            }else if (_.isFunction(grp)) {
                var r = grp();
                if (_.isString(r)) {
                    return [r];
                } else if (_.isArray(r)) {
                    return r;
                }
            }
            return defaultGroups;
        });
        return _.intersection(groups[0], groups[1]).length > 0;
    }

    /**
     * Error class for invalid rules definition
     * @param string message The error message
     * @param string path    The path of the invalid definition
     */
    function RulesConfigurationError(message, path)
    {
        var self       = new Error();
        self.path      = path;
        self.message   = "Rules configuration error : "+message+(path ? " at path : "+path : "");
        self.name      = 'RulesConfigurationError';
        self.__proto__ = RulesConfigurationError.prototype;
        return self;
    }


    /**
     * Common methods used by ObjectValidator, FieldValidator
     * @type Object
     */
    var ValidatorCommon = {
        parent: undefined,
        path:   undefined,
        config: undefined,

        setParent: function(parent) {
            this.parent = parent;
        },
        getParent: function() {
            return this.parent;
        },
        setConfig: function(config) {
            this.config = config;
        },
        getConfig: function() {
            if (this.getParent()) {
                return _.merge(this.getParent().getConfig(), this.config || {});
            } else {
                return _.merge(defaultConfig, this.config || {});
            }
        },
        setPath: function(path) {
            this.path = path;
        },
        getPath: function(fieldName) {
            return typeof(fieldName) != 'undefined' ? (this.path ? (this.path + "." + fieldName) : fieldName): (this.path);
        }
    };

    /**
     * Error class to handle object validation errors. It contains a list of fields and / or global errors
     * @param string path         The path of the invalid object
     * @param object data         The data of the invalid object
     * @param array  fieldErrors  An array of FieldValidatorError errors
     * @param array  globalErrors An array of global Errors
     */
    var ObjectValidatorError = function(path, data, fieldErrors, globalErrors)
    {
        var self           = new Error();
        self.__proto__     = ObjectValidatorError.prototype;
        self.message       = "Object validator Error";
        self.name          = 'ObjectValidatorError';
        self.path          = path;
        self.data          = data;
        self.fieldErrors   = fieldErrors  || [];
        self.globalErrors  = globalErrors || [];

        return self;
    };

    /**
     * Return a flat version of the object errors
     * @return {[type]} [description]
     */
    ObjectValidatorError.prototype.flat = function()
    {
        var errors = {}; 
        _.each(this.fieldErrors, function(fieldError) {

            if(fieldError.name === 'RulesConfigurationError') {
                throw fieldError;
            }

            errors = _.merge(errors, fieldError.flat());
        });
        _.each(this.globalErrors, function(globalError) {
            var err = globalError.message;
            if (!_.has(errors, 'global')) {
                errors.global = [];
            }
            errors.global.push(err);
        });
        return errors;
    }

    /**
     * Object Validator is a class that handle javascripts objects validation with rules
     * @param object rules  List of rules to validate object against
     * @param object config Configuration object
     * return object
     */
    function ObjectValidator(rules, config)
    {
        this.rules            = rules;
        if (config) {
            this.setConfig(config);
        }

        return this;
    }
    _.extend(ObjectValidator.prototype, ValidatorCommon);

    ObjectValidator.prototype.getPostValidatorsPromises = function(postValidators, nbFieldErrors, objectData, data, groups)
    {
        var self = this;
        var options = {
            callback: undefined,
            groups:   undefined,
            params:   {},
            always:   false
        };
        var postPromises = [];
        _.each(postValidators, function(postValidatorDefinition) {

            var o = _.extend(options, _.isFunction(postValidatorDefinition) ? {callback: postValidatorDefinition} : postValidatorDefinition);

            if (!_.isFunction(o.callback)) {
                throw new RulesConfigurationError("Post validator callback missing");
            }

            if ((nbFieldErrors === 0 || o.always === true) && matchGroups(options.groups, groups)) {
                postPromises.push(function(callback, objectData, data, rules, params) {
                    return new Promise(function(resolve, reject) {
                        try {
                            var ret = callback(objectData, data, rules, params);
                            resolve(ret);
                        } catch(e) {
                            reject(e);
                        }
                    });
                }(o.callback, objectData, data, self.rules, o.params));
            }
        });
        return postPromises;
    };

    ObjectValidator.prototype.validate = function(data, validationOptions)
    {
        var options = _.extend({
            groups:      undefined,
            errors_flat: false
        }, validationOptions);

        var self = this;
        var objectData = getValueAt(data, this.path);
        return new Promise(function(resolve, reject){
            var promises = [];
            _.each(self.rules, function(fieldRules, path) {
                if (path == '_post') {
                    return;
                }
                var fv = new FieldValidator(fieldRules);
                fv.setPath(path);
                fv.setParent(self);
                fv.setPath(self.getPath(path));
                promises.push(fv.validate(data, options));
            });

            Promise.settle(promises).then(function(promisesResults) {
                var errors         = [];
                var postValidators = [];
                var postPromises   = [];
                var cleanFields = [];

                _.each(promisesResults, function(promiseResult) {
                    if (promiseResult.isRejected()) {
                        if (_.isArray(promiseResult.reason())) {
                            errors = errors.concat(promiseResult.reason());
                        } else {
                            errors.push(promiseResult.reason());
                        }
                    }

                    if(promiseResult.isFulfilled() && promiseResult.value() != null) {
                        cleanFields.push(promiseResult.value());
                    }
                });

                postPromises = self.getPostValidatorsPromises(self.rules._post, errors.length, objectData, data, options.groups);

                Promise.settle(postPromises).then(function(postPromisesResults) {
                    var globalErrors = [];
                    _.each(postPromisesResults, function(promiseResult) {
                        if (promiseResult.isRejected()) {
                            if (_.isArray(promiseResult.reason())) {
                                globalErrors = globalErrors.concat(promiseResult.reason());
                            } else {
                                globalErrors.push(promiseResult.reason());
                            }
                        }

                        if(promiseResult.isFulfilled() && promiseResult.value() != null) {
                            cleanFields.push(promiseResult.value());
                        }
                    });

                    if (errors.length > 0 || globalErrors.length > 0) {
                        reject(new ObjectValidatorError(self.path, objectData, errors, globalErrors));
                    } else {
                        resolve(cleanFields);
                    }
                });
            });
        });
    };

    /**
     * Error class to handle validation errors on a field
     * @param string path          The field's path
     * @param mixed  fieldValue    The field value
     * @param array  errors        An array of ValidationError
     * @param array  errorsContent An array of ValidationError on the field children
     */
    var FieldValidatorError = function(path, fieldValue, errors, errorsContent)
    {
        var e = {};
        var er = {};
        if (_.isArray(errors) && errors.length > 0) {
            er.errors = errors;
        }
        if (_.isArray(errorsContent) && errorsContent.length > 0) {
            er.content = errorsContent;
        }

        var self           = new Error();
        self.__proto__     = FieldValidatorError.prototype;
        self.message       = er;
        self.name          = 'FieldValidatorError';
        self.path          = path;
        self.fieldValue    = fieldValue;
        self.errors        = errors || [];
        self.errorsContent = errorsContent || [];

        return self;
    };

    FieldValidatorError.prototype.flat = function()
    {
        var errors = {};
        if (this.errors.length > 0) {
            errors[this.path] = this.errors;
        }
        if (this.errorsContent.length > 0) {
            _.each(this.errorsContent, function(errorContent) {
                errors = _.merge(errors, errorContent.flat());
            });
        }

        return errors;
    }


    /**
     * Object to validate rules again data field
     * @param array  rules  list of rules to apply
     * @param object config configuration object
     */
    function FieldValidator(rules, config)
    {
        this.rules      = rules;
        this.fieldLabel = undefined;
        if (config) {
            this.setConfig(config);
        }
    }
    _.extend(FieldValidator.prototype, ValidatorCommon);

    FieldValidator.prototype.getFieldLabel = function()
    {
        if (!_.isUndefined(this.fieldLabel)) {
            return this.fieldLabel;
        }

        if (this.getConfig().labelizer && _.isFunction(this.getConfig().labelizer)) {
            return this.getConfig().labelizer(this.path);
        } else {
            return this.path;
        }
    };

    FieldValidator.prototype.setFieldLabel = function(fieldLabel)
    {
        this.fieldLabel = fieldLabel;
    };

    FieldValidator.prototype.getFieldErrors = function(path, fieldValue, errors, errorsContent)
    {
        return new FieldValidatorError(path, fieldValue, errors, errorsContent);
    };

    FieldValidator.prototype.validate = function(data, options)
    {
        var self       = this;
        var fieldData  = getValueAt(data, self.getPath());

        if (_.has(self.rules, '_label')) {
            this.setFieldLabel(self._label);
            delete self.rules._label;
        }

        return new Promise(function(resolve, reject) {
            // Do not validate a empty field or his content if the field is required and empty
            // The field is mandatory, don't go further if the field is empty
            if (_.has(self.rules, 'required'))
            {
                var validator = new Validator('required', self.rules.required);
                validator.setParent(self);
                validator.validate(fieldData, data, options)
                    .then(function() {
                        return resolve(self.doValidate(data, options));
                    })
                    .catch(ValidatorError, function(e) {
                        return reject(self.getFieldErrors(self.getPath(), fieldData, [e]));
                    });
            } else {
                return resolve(self.doValidate(data, options));
            }
        });
    };

    FieldValidator.prototype.doValidate = function(data, options)
    {
        var self            = this;
        return new Promise(function(resolve, reject) {
            var promises            = [];
            var promisesContent     = [];
            var contentConfig       = false;
            var contentType         = "";
            var promiseContentIndex;
            var fieldData           = getValueAt(data, self.getPath());

            _.each(self.rules, function(ruleConfig, ruleType) {
                if (ruleType == 'required') {

                    // To have same result object than others validator
                    var validator = new Validator(ruleType, ruleConfig);
                    validator.setParent(self);
                    promises.push(Promise.resolve(validator.getCleanData(fieldData)));

                } else if (ruleType == 'contentObjects') {
                    contentType   = 'objects';
                    contentConfig = ruleConfig;
                } else if (ruleType == 'contentValues') {
                    contentType   = 'values';
                    contentConfig = ruleConfig;
                } else {
                    if (ruleType.substring(0, 6) == 'custom') {
                        ruleType = 'custom';
                    }
                    var validator = new Validator(ruleType, ruleConfig);            // XXX Should add the global config
                    validator.setParent(self);
                    promises.push(validator.validate(fieldData, data, options));
                }
            });

            /* Apply content rules if we have a non empty array */
            if (contentConfig && fieldData && _.isArray(fieldData) && !rulesUtils.isEmpty(fieldData)) {
                _.each(fieldData, function(v, k) {
                    var p = self.getPath(k);
                    var validator = (contentType == 'objects') ? new ObjectValidator(contentConfig) : new FieldValidator(contentConfig);
                    validator.setParent(self);
                    validator.setPath(p);
                    promisesContent.push(validator.validate(data, options));
                });
                promiseContentIndex = promises.length;
                promises = promises.concat(promisesContent);
            }

            Promise.settle(promises).then(function(promisesResults) {
                var errors        = [];
                var errorsContent = [];
                var cleanFields = [];

                _.each(promisesResults, function(promiseResult, ri) {
                    if (promiseResult.isRejected()) {
                        var reason = promiseResult.reason();
                        if (_.isArray(reason)) {
                            if (!_.isUndefined(promiseContentIndex) && ri >= promiseContentIndex) {
                                errorsContent = errorsContent.concat(reason);
                            } else {
                                errors = errors.concat(reason);
                            }
                        } else {
                            if (!_.isUndefined(promiseContentIndex) && ri >= promiseContentIndex) {
                                errorsContent.push(reason);
                            } else {
                                errors.push(reason);
                            }
                        }
                    }

                    if(promiseResult.isFulfilled()) {
                        cleanFields.push(promiseResult.value());
                    }
                });

                if (errors.length > 0 || errorsContent.length > 0) {
                    return reject(self.getFieldErrors(self.getPath(), fieldData, errors, errorsContent));
                } else {
                    resolve(_.uniq(_.filter(cleanFields, function(obj){ return obj != undefined && obj.value != undefined}), "field")[0]);
                }
            });
        });
    };

    /**
     * Error class to handle a simple validation error on a data
     */
    var ValidatorError = function()
    {
        var self           = new Error();
        self.name          = 'ValidatorError';

        return self;
    }

    /**
     * Validator object validate a data based on a configured rule. It raise an error or reject a promise
     * @param string type   The validator type (must be present in the rules objects)
     * @param object config The validator type configuration
     */
    function Validator(type, config)
    {
        this.type           = type;
        this.message        = undefined;
        this.value          = undefined;
        this.groups         = undefined;
        this.fieldValidator = undefined;
        this.parent         = undefined;

        if (typeof(config) === 'object') {
            this.groups = config.groups;

            if (_.has(config, 'message'))
                this.message = config.message;

            if (_.has(config, 'value') && !_.isUndefined(config.value))
                this.value = config.value;

        } else if (!_.isUndefined(config)) {
            this.value = config;
        }

        return this;
    }

    Validator.prototype.setParent = function(parent)
    {
        this.parent = parent;
    };

    Validator.prototype.getParent = function()
    {
        return this.parent;
    };

    Validator.prototype.getMessage = function(data)
    {
        if (!this.message) {
            if (this.getParent()) {
                var c = this.getParent().getConfig().errors.messages;
                return this.type == 'required' ? c.required : c.invalid;
            } else {
                return undefined;
            }
            if (this.type == 'required') {
                return this.config.errors.messages.required;
            } else {
                return this.config.errors.messages.invalid;
            }
        } else {
            return this.message;
        }
    };

    Validator.prototype.setMessage = function(message)
    {
        this.message = message;
    };

    Validator.prototype.getError = function(data)
    {
        var fieldLabel = this.getParent() ? this.getParent().getFieldLabel() : 'This value';
        var message    = this.getMessage();

        if (_.isUndefined(message)) {
            if (this.type == 'required') {
                message = "The field %%fieldLabel%% is required";
            } else {
                message = "Invalid %%fieldLabel%% with value -> %%fieldValue%% <- for type " + this.type;
            }
        } else if (_.isString(message)) {

        } else if (_.isFunction(message)) {
            message = message(fieldName);
        } else {
            throw new RulesConfigurationError("Invalid error message set for type", this.type);
        }

        message = message.replace(/%%fieldLabel%%/gi, fieldLabel)
                         .replace(/%%fieldValue%%/gi, data);

        return message;
    };

    Validator.prototype.getCleanData = function(data) {

        var fieldLabel = this.getParent() ? this.getParent().path: 'arg';

        return {
            field: fieldLabel,
            value: data
        };
    }

    Validator.prototype.doValidate = function(fieldData, data)
    {
        var self = this;

         
        var type = this.type;
        var path = self.getParent() != undefined && self.getParent().path != undefined? self.getParent().path: type;
        if (!type || !_.isString(type)) {
            throw new RulesConfigurationError("Invalid validator type", path);
        }

        if (!rules[type]) {
            throw new RulesConfigurationError("Validator type " + type + " not found", path);
        }

        if (!this.value) {
            throw new RulesConfigurationError("No value property found", path);
        }

        return new Promise(function(resolve, reject){
            var error = {};
                error[self.type] = self.getMessage(fieldData);

            if (!rules[self.type]) {

            }

            p = rules[self.type](fieldData, self.value, data);

            if (_.isBoolean(p)) {
                return p ? resolve(self.getCleanData(fieldData)) : reject(self.getError(fieldData));
            } else if (rulesUtils.isPromise(p)) {
                p.then(function() {
                    return resolve(self.getCleanData(fieldData));
                }).catch(function(e) {
                    return reject(self.getError(fieldData));
                });
            } else {
                return reject(new RulesConfigurationError("Validator should return a Promise or a boolean and not " + (typeof p)));
            }
        });
    };

    Validator.prototype.validate = function(fieldData, data, options)
    {
        if (matchGroups(options ? options.groups : undefined, this.groups)) {
            return this.doValidate(fieldData, data);
        } else {
            return Promise.resolve(fieldData);
        }
    };


    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = {
            ObjectValidator:          function(rules, config) { return new ObjectValidator(rules, config); },
            FieldValidator:           function(rules, config) { return new FieldValidator(rules, config); },
            Validator:                function(type, config)  { return new Validator(type, config); },
            ObjectValidatorError:     ObjectValidatorError,
            FieldValidatorError:      FieldValidatorError,
            ValidatorError:           ValidatorError,
            RulesConfigurationError:  RulesConfigurationError,
            addRules:                 addRules
        };
    } else if (typeof(define) !== 'undefined') {
        define(function() {
            return ruleBasedValidator;
        });
    } else {
        this.ruleBasedValidator = ruleBasedValidator;
    }
}());
