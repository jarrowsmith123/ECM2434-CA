var Promise = require('bluebird');
var _       = require('lodash');

// private variables
var regularExpressions = {
        email: /^[a-zA-Z0-9+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/,
        url: /^(http(?:s)?\:\/\/[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,6}(?:\/?|(?:\/[\w\-]+)*)(?:\/?|\/\w+\.[a-zA-Z]{2,4}(?:\?[\w]+\=[\w\-]+)?)?(?:\&[\w]+\=[\w\-]+)*)$/,
        integer: /^(?:-?(?:0|[1-9][0-9]*))$/,
        decimal: /^(?:-?(?:0|[1-9][0-9]*))?(?:\.[0-9]*)?$/,
        isIPAddress: /^\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}$/,
        USPhoneNumber: /^[\(]?[0-9]{3}[\)]?[ -\.,]?[0-9]{3}[ -\.,]?[0-9]{4}$/,
        USZipCode: /^\d{5}$|^\d{5}-\d{4}$/
};
var AllowedBoolStrings = 'true,false,yes,no,1,0';

function isDefined(variable) {
    if (_.isUndefined(variable) || _.isNull(variable) || _.isNaN(variable)) {
        return false;
    }
    return true;
}

function isEmpty(variable) {
    var type = typeof variable;
    if (!isDefined(variable)) {
        return true;
    }
    if (type === 'string' && variable.trim() === '') {
        return true;
    }
    if (type === 'object' && _.isEmpty(variable)) {
        return true;
    }

    return false;
}

function isPromise(obj) {
    return (typeof obj == "object") && (typeof obj.then == "function") && obj.constructor && (obj.constructor.name == 'Promise');
}

var ruleHandlers = {
        required: function(fieldValue, ruleValue, data) {
            if (!ruleValue || ruleValue !== true) {
                return true;
            }

            return !isEmpty(fieldValue);
        },

        type: function(fieldValue, ruleValue, data) {
            if (!ruleValue) {
                return true;
            }
            if (!isDefined(fieldValue)) {
                return true;
            }

            if (typeof(fieldValue) !== ruleValue && ruleValue !== 'array')
                return false;

            if(ruleValue === 'array' && Object.prototype.toString.call(fieldValue) !== '[object Array]' )
                return false;

            return true;
        },

        isEmpty: function(fieldValue, ruleValue, data) {
            return ruleHandlers.type(fieldValue, 'array');
        },

        isArray: function(fieldValue, ruleValue, data) {
            return ruleHandlers.type(fieldValue, 'array');
        },

        isString: function(fieldValue, ruleValue, data) {
            return ruleHandlers.type(fieldValue, 'string');
        },

        minLength: function(fieldValue, ruleValue, data) {
            if (isDefined(fieldValue)) {
                if (Object.prototype.toString.call(fieldValue) === '[object Array]' || typeof(fieldValue) === 'string')
                    return fieldValue.length >= ruleValue;

                return false;
            }

            return true;
        },

        maxLength: function(fieldValue, ruleValue, data) {
            if (isDefined(fieldValue)) {
                if (Object.prototype.toString.call(fieldValue) === '[object Array]' || typeof(fieldValue) === 'string')
                    return fieldValue.length <= ruleValue;

                return false;
            }

            return true;
        },

        minValue: function(fieldValue, ruleValue, data) {
            if (isDefined(fieldValue)) {
                if (typeof(fieldValue) === 'number')
                    return fieldValue >= ruleValue;

                return false;
            }

            return true;
        },

        maxValue: function(fieldValue, ruleValue, data) {
            if (isDefined(fieldValue)) {
                if (typeof(fieldValue) === 'number')
                    return fieldValue <= ruleValue;

                return false;
            }

            return true;
        },

        isInt: function(fieldValue, ruleValue, data) {
            return ruleHandlers.regex(fieldValue, regularExpressions.integer);
        },

        isDecimal: function(fieldValue, ruleValue, data) {
            return ruleHandlers.regex(fieldValue, regularExpressions.decimal);
        },

        isBool: function(fieldValue, ruleValue, data) {
            if (!ruleValue || !isDefined(fieldValue))
                return true;

            if (typeof(fieldValue) == 'boolean')
                return true;
            else if (typeof(fieldValue) == 'string' && AllowedBoolStrings.indexOf(fieldValue.toString().toLowerCase()) != -1)
                return true;
            else
                return false;
        },

        isUrl: function(fieldValue, ruleValue, data) {
            return ruleHandlers.regex(fieldValue, regularExpressions.url);
        },

        isEmail: function(fieldValue, ruleValue, data) {
            return ruleHandlers.regex(fieldValue, regularExpressions.email);
        },

        isIPAddress: function(fieldValue, ruleValue, data) {
            return ruleHandlers.regex(fieldValue, regularExpressions.isIPAddress);
        },

        isUSPhoneNumber: function(fieldValue, ruleValue, data) {
            return ruleHandlers.regex(fieldValue, regularExpressions.USPhoneNumber);
        },

        isUSZipCode: function(fieldValue, ruleValue, data) {
            return ruleHandlers.regex(fieldValue, regularExpressions.USZipCode);
        },

        hasValue: function(fieldValue, ruleValue, data) {
            return (fieldValue === ruleValue);
        },

        inList: function(fieldValue, ruleValue, data) {
            if (!ruleValue || typeof ruleValue.indexOf !== 'function') {
                return false;
            }

            return ruleValue.indexOf(fieldValue) >= 0;
        },

        custom: function(fieldValue, ruleValue, data) {
            if (!_.isFunction(ruleValue)) {
                return false;
            }
            return ruleValue(fieldValue, ruleValue, data);
        },

        dependsOn: function(fieldValue, ruleValue, data) {
            return new Promise(function(resolve, reject) {
                console.log(ruleValue.propName);
                console.log("among");
                console.log(data);

                var dependsOnProp = data[ruleValue.propName];
                console.log("depends on : ", dependsOnProp);
                var relatedData = extractData(data, ruleValue.propName);

                if (typeof(relatedData) !== 'undefined' && relatedData.toString() == ruleValue.propValue) {
                    return ruleBasedValidator.validateField(fieldValue, ruleValue.rules)
                            .then(function(){ resolve(); })
                            .catch(function(e){
                                reject(e);
                            });
                }
                console.log("Depends on : auto resolve :(");
                return resolve();
            });
        },

        regex: function(fieldValue, ruleValue, data) {
            if (!ruleValue || !isDefined(fieldValue)) {
                return true;
            }

            if (!ruleHandlers.type(fieldValue, 'string')) {
                return false;
            }

            if (isDefined(fieldValue)) {
                if (Object.prototype.toString.call(ruleValue) === "[object RegExp]") {
                    return ruleValue.test(fieldValue);
                }
            }
            return true;
        },

        notRegex: function(fieldValue, ruleValue, data) {
            if (!isDefined(fieldValue))
                return true;

            return !ruleHandlers.regex(fieldValue, ruleValue, data);
        }
    };

module.exports = {
    rules: ruleHandlers,
    utils: {
        isDefined: isDefined,
        isPromise: isPromise,
        isEmpty:   isEmpty
    }
};
