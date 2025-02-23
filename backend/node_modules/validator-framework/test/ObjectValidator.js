var chai           = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;

var validator = require('../src/validator');
var Promise   = require('bluebird');
var _         = require('lodash');

describe('#objectValidator', function() {
  it('construct with rules', function() {
    return validator.ObjectValidator({
        field1: {
            required: true,
            isEmail: true
        }
    });
  });
});


describe('#objectValidator post validators', function() {
    var rules = {
        field1: { required: true, isEmail: true }
    };

    var assertsOnError = function(done, nbFieldsErrors, nbGlobalErrors) {
        if (nbFieldsErrors == 0 && nbGlobalErrors == 0) {
            return function(e) { done(new Error("Should not failed"))};
        }
        return function(e) {
            try {
                assert.isObject(e, "Error should be an object");
                assert.instanceOf(e, validator.ObjectValidatorError, "Error should be an instance of ObjectValidatorError");
                assert.isArray(e.fieldErrors, "Error.fieldErrors should be an array");
                assert.isArray(e.globalErrors, "Error.globalErrors should be an array");
                assert.equal(e.fieldErrors.length, nbFieldsErrors, "Error.fieldErrors should contains " + nbFieldsErrors + " element(s)");
                assert.equal(e.globalErrors.length, nbGlobalErrors, "Error.globalErrors should contains " + nbGlobalErrors + " element(s)");
            } catch(e) {
                return done(e);
            }
            done();
        }
    }

    var testsPostsValidators = [{
            name:        'Should handle post validation succeed as function',
            data:        {field1: 'valid@email.com'},
            postRules:   [function() { return true; }],
            fieldsRules: {field1: { required: true, isEmail: true}},
            succeed:     true,
            asserts:     {fieldsErrors: 0, globalErrors: 0}
        },{
            name:        'Should handle post validation succeed from promise',
            data:        {field1: 'valid@email.com'},
            postRules:   [function() { return Promise.resolve(); }],
            fieldsRules: {field1: { required: true, isEmail: true}},
            succeed:     true,
            asserts:     {fieldsErrors: 0, globalErrors: 0}
        },{
            name:       'Should handle post validation failed by function',
            data:        {field1: 'valid@email.com'},
            postRules:   [function() { throw new Error('POST_RULE_ERROR_FUNCTION') }],
            fieldsRules: {field1: { required: true, isEmail: true}},
            succeed:     false,
            asserts:     {fieldsErrors: 0, globalErrors: 1}
        },{
            name:       'Should handle post validation failed from promise',
            data:        {field1: 'valid@email.com'},
            postRules:   [function() { return Promise.reject('POST_RULE_ERROR_PROMISE'); }],
            fieldsRules: {field1: { required: true, isEmail: true}},
            succeed:     false,
            asserts:     {fieldsErrors: 0, globalErrors: 1}
        },{
            name:        'Should ignore (not always) global validation if field validation failed',
            data:        {field1: 'invalidemail'},
            postRules:   [function() { return Promise.reject('POST_RULE_FAILED')}],
            fieldsRules: {field1: { required: true, isEmail: true}},
            succeed:     false,
            asserts:     {fieldsErrors: 1, globalErrors: 0}
        },{
            name:        'Should not ignore (always) global validation if field validation failed',
            data:        {field1: 'invalidemail'},
            postRules:   [{always: true, callback: function() { return Promise.reject('POST_RULE_FAILED')}}],
            fieldsRules: {field1: { required: true, isEmail: true}},
            succeed:     false,
            asserts:     {fieldsErrors: 1, globalErrors: 1}
        }
    ];

    _.each(testsPostsValidators, function(testPostValidators) {
        it(testPostValidators.name, function(done) {
            var rules = testPostValidators.fieldsRules;
                rules['_post'] = testPostValidators.postRules;

            validator.ObjectValidator(rules).validate(testPostValidators.data)
            .then(function() { testPostValidators.succeed ? done() : done(new Error('Should not succeed')) })
            .catch(assertsOnError(done, testPostValidators.asserts.fieldsErrors, testPostValidators.asserts.globalErrors));
        })
    });



})
