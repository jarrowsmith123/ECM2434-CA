var chai           = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;

var validator = require('../src/validator');
var Promise = require('bluebird');

var _       = require('lodash');

describe('#Validator', function() {
    it('should construct with a type and a config as boolean', function() {
        return validator.Validator('required', true).should.be.an.object;
    });
    it('should raised an exception with empty rules', function() {
        return expect(function(){validator.Validator('required').validate()}).to.throw(validator.RulesConfigurationError);
    });
    it('should raised an exception with empty rules', function() {
        return expect(function(){validator.Validator('required', {}).validate()}).to.throw(validator.RulesConfigurationError);
    });
    it('shoud raised an exception with unknow rule type', function() {
        return expect(function(){validator.Validator('unknowtype').validate()}).to.throw(validator.RulesConfigurationError);
    });
});

describe('#Validator validation groups', function() {
    it('should handle validation without validation group', function() {
        return validator.Validator('required', true).validate().should.be.rejected;
    });
    it('should handle validation with the default group validation as a string', function() {
        return validator.Validator('required', {value: true, groups: "default"}).validate().should.be.rejected;
    });
    it('should handle validation with the default group validation as an array', function() {
        return validator.Validator('required', {value: true, groups: ["default"]}).validate().should.be.rejected;
    });
    it('should not handle validation with an alternative group specified', function() {
        return validator.Validator('required', {value: true, groups: ["test"]}).validate().should.be.fulfilled;
    });
    it('should not handle validation with mismatch groups', function() {
        return validator.Validator('required', {value: true}).validate(null, null, {groups: "test"}).should.be.fulfilled;
    });
    it('should handle validation with matching groups', function() {
        return validator.Validator('required', {value: true, groups: ["test"]}).validate(null, null, {groups: "test"}).should.be.rejected;
    });
    it('sould handle validation with mismatch groups but default one', function() {
       return validator.Validator('required', {value: true}).validate(null, null, {groups: ["test", "default"]}).should.be.rejected;
    });
});

describe('#Validator custom', function() {
    var customValidatorFunctionBoolSuccess    = function(fieldValue, ruleValue, data) { return true; }
    var customValidatorFunctionBoolFailed     = function(fieldValue, ruleValue, data) { return false; }
    var customValidatorFunctionPromiseSuccess = function(fieldValue, ruleValue, data) { return Promise.resolve(true); }
    var customValidatorFunctionPromiseFailed  = function(fieldValue, ruleValue, data) { return Promise.reject(); }


    it('should handle custom validation success returning boolean', function() {
        return validator.Validator('custom', customValidatorFunctionBoolSuccess).validate().should.be.fulfilled;
    });
    it('should handle custom validation failed returning boolean', function() {
        return validator.Validator('custom', customValidatorFunctionBoolFailed).validate().should.be.rejected;
    });
    it('should handle custom validation success returning promise', function() {
        return validator.Validator('custom', customValidatorFunctionPromiseSuccess).validate().should.be.fulfilled;
    });
    it('should handle custom validation failed returning promise', function() {
        return validator.Validator('custom', customValidatorFunctionPromiseFailed).validate().should.be.rejected;
    });
});


describe('#Validator Custom Rules Type', function() {
    var newRules = {
        testRuleBool: function(fieldValue, ruleValue, data) {
            if (fieldValue == 'test') {
                return true;
            } else {
                return false;
            }
        },

        testRulePromise: function(fieldValue, ruleValue, data) {
            return new Promise(function(resolve, reject) {
                return fieldValue == 'test' ? resolve() : reject();
            });
        },

        testRulePromiseConditional: function(fieldValue, ruleValue, data) {
            return new Promise(function(resolve, reject) {
                return data.id == "1" && fieldValue == 'test' ? resolve() : reject();
            });
        }
    };

    it('should accept the definition of new rules', function() {
        var o = validator.addRules(newRules);
        return expect(o).to.have.property('testRuleBool') && expect(o).to.have.property('testRulePromise');
    });

    it('should recognize new bool rules and fulfil if value is correct', function() {
        return validator.Validator('testRuleBool', true).validate('test').should.be.fulfilled;
    });

    it('should recognize new bool rules and reject if value is incorrect', function() {
        return validator.Validator('testRuleBool', true).validate('not_test').should.be.rejected;
    });

    it('should recognize new promise rules and fulfil if value is correct', function() {
        return validator.Validator('testRulePromise', true).validate('test').should.be.fulfilled;
    });

    it('should recognize new promise rules and reject if value is incorrect', function() {
        return validator.Validator('testRulePromise', true).validate('not_test').should.be.rejected;
    });


    it('should recognize new promise rules with validation depending to extra data and fulfil if value is correct', function() {
        return validator.Validator('testRulePromiseConditional', true).validate('test', {id: "1"}).should.be.fulfilled;
    });

    it('should recognize new promise rules with validation depending to extra data and reject if value is incorrect', function() {
        return validator.Validator('testRulePromiseConditional', true).validate('test', {id: "2"}).should.be.rejected;
    });

});
