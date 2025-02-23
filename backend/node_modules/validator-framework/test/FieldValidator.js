var chai           = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;

var validator = require('../src/validator');
var Promise = require('bluebird');
var _       = require('lodash');

describe('#fieldValidator', function() {
    it('should construct with rules and an empty path', function() {
        return validator.FieldValidator({}).should.be.an.object;
    });
    it('should construct with rules and a path', function() {
        return validator.FieldValidator({}, 'fieldname').should.be.an.object;
    });
    it('should validate an undefined data with no rules', function() {
        return validator.FieldValidator({}).validate().should.be.fulfilled;
    });
    it('should not validate a required data with undefined data', function() {
        return validator.FieldValidator({required: true}).validate().should.be.rejected;
    });
    it('should validate a non empty data with a required rules', function() {
        return validator.FieldValidator({required: true}).validate('hey').should.be.fulfilled;
    });
    it('should found the correct data path among data with a required rules', function() {
        return validator.FieldValidator({required: true}, "user.name").validate({user: {name: "Françis"}}).should.be.fulfilled;
    });
    it('should ignore others validations if required failed', function(done) {
        validator.FieldValidator({isEmail: true, required: true}, "email")
                 .validate()
                 .then(function() { done("should not resolve with a required rules and an empty data"); })
                 .catch(function(e) {
                    try {
                        assert.isObject(e, "Error should be an object");
                        assert.instanceOf(e, validator.FieldValidatorError, "Error should be an instance of FieldValidatorError");
                        assert.isArray(e.errors, "Error.errors should be an array");
                        assert.equal(e.errors.length, 1, "Error.errors should contains only one element");
                    } catch(e) {
                        return done(e);
                    }
                    done();
                 });
    });
});

describe('#fieldValidator validation groups', function() {
    it('should handle validation without validation group', function() {
        return validator.FieldValidator({required: true}).validate().should.be.rejected;
    });
    it('should handle validation with the default group validation as a string', function() {
        return validator.FieldValidator({required: {value: true, groups: "default"}}).validate().should.be.rejected;
    });
    it('should handle validation with the default group validation as an array', function() {
        return validator.FieldValidator({required: {value: true, groups: ["default"]}}).validate().should.be.rejected;
    });
    it('should not handle validation with an alternative group specified', function() {
        return validator.FieldValidator({required: {value: true, groups: ["test"]}}).validate().should.be.fulfilled;
    });
    it('should not handle validation with mismatch groups', function() {
        return validator.FieldValidator({required: {value: true}}).validate(null, {groups: "test"}).should.be.fulfilled;
    });
    it('should handle validation with matching groups', function() {
        return validator.FieldValidator({required: {value: true, groups: ["test"]}}).validate(null, {groups: "test"}).should.be.rejected;
    });
    it('sould handle validation with mismatch groups but default one', function() {
       return validator.FieldValidator({required: {value: true}}).validate(null, {groups: ["test", "default"]}).should.be.rejected;
    });
});

describe('#fieldValidator multiple custom validator', function() {
    it('should handle multiple custom validators', function() {
        return validator.FieldValidator({custom1: function(){ return true}, custom2: function() {return false;}}).validate().should.be.rejected;
    })
});

describe("#fieldValidator custom validator", function() {
    it('should handle conditional check with path configured', function() {

        var fieldValidator = validator.FieldValidator(
                {
                    custom: function(fieldValue, ruleValue, data) {
                        return data.id == "1" && fieldValue == "validator-framework"
                    }
                }, 'me'
        );
        fieldValidator.setPath("me");

        return fieldValidator.validate({
            me: "validator-framework",
            id: "1"}
        ).should.be.fulfilled;
    })

    it('should handle conditional check without path configured', function() {

        var fieldValidator = validator.FieldValidator(
                {
                    custom: function(fieldValue, ruleValue, data) {
                        return data.id == "1" && fieldValue.me == "validator-framework"
                    }
                }, 'me'
        );

        return fieldValidator.validate({
            me: "validator-framework",
            id: "1"}
        ).should.be.fulfilled;
    })
})
