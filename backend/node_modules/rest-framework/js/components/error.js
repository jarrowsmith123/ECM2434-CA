var _ = require('lodash');

var rfUtils = require('./utils');

module.exports = function(config) {
    return new handler(config);
}


handler = function(config) {
    this.config = config;

    this.NotFoundError.prototype = Object.create(Error.prototype);
    this.AccessDeniedError.prototype = Object.create(Error.prototype);
    this.MissingParametersError.prototype = Object.create(Error.prototype);
    this.ValidationParametersError.prototype = Object.create(Error.prototype);

    return this;
}

handler.prototype.handleError = function(e, req, res, next) {

    var self = this;

    if (e instanceof Error) {

        // Better to use EventEmitter no ?
        if (this.config.debug == true) {
            console.log(e.stack)
        }

        var errorDisplayed = {error: rfUtils.errorsToString(e)};

        if (this.config.debug) {
            errorDisplayed.stack = e.stack;
        }

        // Handle default Javascript Error as Internal Error
        if (e instanceof TypeError || e instanceof ReferenceError) {
            return res.status(500).json(self.formatError(500, rfUtils.errorsToString(e), ""));
        }

        // Handle our rest-framework error
        switch (e.name) {
            case 'NotFoundError':
                return res.status(404).json(self.formatError(404, rfUtils.errorsToString(e), e.details));
                break;
            case 'ValidationParametersError':
                return res.status(400).json(self.formatError(400, rfUtils.errorsToString(e), e.details));
                break;
            case 'MissingParametersError':
                return res.status(400).json(self.formatError(400, rfUtils.errorsToString(e), e.details));
                break;
            case 'AccessDeniedError':
                return res.status(403).json(self.formatError(403, rfUtils.errorsToString(e), e.details));
                break;
        }

        // If you emit custom error with statusCode
        if (e.statusCode != undefined) {
            return res.status(e.statusCode).json(self.formatError(e.statusCode, rfUtils.errorsToString(e), e.details != undefined ? e.details : ""));
        }

        // bad use of rest-framework
        return res.status(500).json(self.formatError(500, rfUtils.errorsToString(e), e.details != undefined ? e.details : ""));
    }

    return res.status(500).json(self.formatError(500, e, ""));
}

handler.prototype.NotFoundError = function(message, type, id)
{
    var self = this;

    self.type = type;
    self.message = "NOT_FOUND";
    self.item_id = id;
    if (message != "") {
        self.message = message;
    }

    self.details = type + " not found with id: " + id;
    self.name = 'NotFoundError';

    Error.captureStackTrace(this, handler.prototype.NotFoundError);
    return self;
}


handler.prototype.AccessDeniedError = function(message, reason)
{
    var self = this;

    self.message = "NOT_ALLOWED";
    if (message != "") {
        self.message = message;
    }

    self.details = reason;
    self.reason = reason;

    self.name = 'AccessDeniedError';
    Error.captureStackTrace(this, handler.prototype.AccessDeniedError);
    return self;
}


handler.prototype.MissingParametersError = function(message, fields)
{
    var self = this;

    self.message = "MISSING_PARAMETERS";
    if (message != "") {
        self.message = message;
    }

    if (_.isArray(fields)) {
        self.details = fields.join(",");
    }
    else {
        self.details = "";
    }

    self.name = 'MissingParametersError';
    self.fields = fields;

    Error.captureStackTrace(this, handler.prototype.MissingParametersError);
    return self;
}

handler.prototype.ValidationParametersError = function(domainsErrors)
{
    var self = this;

    self.message = "INVALID_PARAMETERS";

    var messages = []
    var errorOnField = [];
    _.each(domainsErrors, function(domain) {

        try {
            var flatError = domain.flat();
            _.forIn(flatError, function(value, key) {
                errorOnField.push({
                    "field": key,
                    "error": value,
                    "on": domain.applyOn
                });
            });
        } catch (rulesError) {
            errorOnField.push({
                "field": rulesError.path,
                "error": rulesError.message,
                "on": domain.applyOn
            });
        }

        // messages.push(JSON.stringify(e.flat()));
    });

    self.details = {
        errors: _.values(errorOnField)
    }

    self.name = 'ValidationParametersError';

    Error.captureStackTrace(this, handler.prototype.ValidationParametersError);
    return self;
}

handler.prototype.formatError = function(statusCode, message, details) {

    return {
        statusCode: statusCode,
        error: message,
        details: details,
        date: new Date()
    }
}