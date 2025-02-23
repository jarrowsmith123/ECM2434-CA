var util = require('util');
var _ = require('lodash');

module.exports = {
    errorsToString: function(error) {
        if (_.isArray(error)) {
            return _.map(error, module.exports.errorsToString);
        } else if (_.isString(error)) {
            return error;
        } else if (util.isError(error)) {
            return error.message;
        }
        return error;
    },
    generator: function(length) {
        return require('crypto').randomBytes(length).toString('hex');
    },
    isPromise: function(object) {
        return object === Object(object) && typeof object.then === "function";
    }
}
 