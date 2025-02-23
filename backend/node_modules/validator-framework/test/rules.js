var chai           = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;

var validator = require('../src/validator');
var Promise   = require('bluebird');
var _         = require('lodash');

var rules = require('../src/rules').rules;
var rulesUtils = require('../src/rules').utils;

var utilsTests = {
    isDefined: {
        succeed: ['value', 1, ['value'], {field: 'value'}, true, false],
        failed:  [[], null, undefined, "", {}]
    },
    isEmpty: {
        succeed: ['value', 1, ['value'], {field: 'value'}, true, false],
        failed:  [[], null, undefined, "", {}]
    }
}

var rulesTests = {
    isEmail: {
        succeed: ['toto@email.com', 'vincent.bouzeran@test.elao.com'],
        failed:  ['toto', true, [], {}, ['toto@email.com'], false, "test@", "test@@email.com"]
    }
}

_.each(rulesTests, function(tests, rule) {
    describe('#rule: '+rule, function() {
        var testedRule = rules[rule];

        it ("Rule '"+rule+"' exists", function() {
            return testedRule.should.be.a('function');
        });

        if (tests.succeed) {
            _.each(tests.succeed, function(value) {
                it("Succeed with : "+value, function() {
                    return testedRule(value, true).should.be.true;
                })
            });
        }

        if (tests.failed) {
            _.each(tests.failed, function(value) {
                it("Failed with : "+value, function() {
                    return testedRule(value, true).should.be.false;
                })
            });
        }
    })
})


