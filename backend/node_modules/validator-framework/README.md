TODO

#Features:

    - Nested Objects validation
    - Custom rules
    - Custom validator
    - Post validation
    - Custom errors message
    - Async validation
    - Use of promises
    - Validation groups
    - Global validators
    - Custom field labels


#Description:

    validator-magic handle objects validation

#Install

    npm install validator-magic


#Usage:

    var validator = require('validator-magic');

    var myobject = {
        username: 'Elao',
        email:    'contact@elao.com',
    };

    var rules = {
        username: {required: true},
        email:    {required: true, isEmail: true},
        website:  {required: true, isUrl: true}
    };

    validator.ObjectValidator(rules).validate(myobject)
             .then(function() { /** Validation succeed **/ })
             .catch(function(e) {
                /** Validation failed **/
             })


=> Nested objects validation

=> Global validators

=> Post validator

=> Customize field label and errors messages

=> Getting validation errors as a flat object




=> Available Asserts:

    required: ...

    isEmail: ...



=> Using the validation groups :

    Exemple:

    var rules = {
        username: {
            isRequired: {
                value: true,
                group: ['create']
            }
        },
        email: {
            isRequired: {
                value: true,
                group: ['create']
            },
            isEmail: true
        }
    }




=> Using the custom validator :

    Exemple with boolean validation:

        var rules = {
            username: {
                custom: function(fieldValue, ruleValue, data) { return isItValid ? true : false }
            }
        }

    Exemple with promise validator:

        var rules = {
            username: {
                custom: function(fieldValue, ruleValue, data) { return new Promise(function(resolve, reject) { return isItValid ? resolve() : reject() }) }
            }
        }


=> Adding custom validator (to reuse validator) - or overwrite existing

    var validator = require('validator-magic');

    var newValidatorTypes = {
        myNewValidatorType: function(fieldValue, ruleValue, data) {
            return new Promise(function(resolve, reject) {
                if (ruleValue.)
            });
        }
    }

