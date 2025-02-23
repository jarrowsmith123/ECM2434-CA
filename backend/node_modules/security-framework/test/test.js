var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var should = require('chai').should(),
        expect = require('chai').expect,
        assert = require('chai').assert;

var Promise = require('bluebird');
var _ = require('lodash');

var express = require('express');
var request = require('supertest');


describe('Security', function() {

    describe('Check configuration ', function() {

        it('should throw an error when not initialized whit good data structure', function() {

            var securityEmpty = require('../src/security')({
            });

            var fn = function() {
                securityEmpty.validate();
                securityEmpty.getSecurityMiddleware("rule_not_valid");
            }

            return expect(fn).to.throw('security configuration error, missing methods or rules');
        });

        it('should throw an error when get security middleware without valide configuration', function() {

            var securityEmpty = require('../src/security')({
                methods: {},
                rules: {}
            });

            var fn = function() {
                securityEmpty.getSecurityMiddleware("rule_not_valid");
            }

            return expect(fn).to.throw('you must validate security configuration');
        });

        it('should throw an error when get wrong name security middleware', function() {

            var security = require('../src/security')({
                methods: {},
                rules: {}
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("rule_not_valid")({}, {}, null);
            }

            return expect(fn).to.throw('invalid rule rule_not_valid');
        });

        it('should throw an error when get wrong methodsMode', function() {

            var security = require('../src/security')({
                methods: {},
                rules: {
                    me: {
                        methodsMode: 'xx',
                        methods: ['http']
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {}, null);
            }

            return expect(fn).to.throw("invalid mode \'xx\'");
        });

        it('should throw an error because http are not configured', function() {

            var security = require('../src/security')({
                methods: {},
                rules: {
                    me: {
                        methods: ['http']
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {json: function() {
                    }}, null);
            }

            return expect(fn).to.throw("http basic middleware wasn\'t configure");
        });

        it('should throw an error because oauth are not configured', function() {

            var security = require('../src/security')({
                methods: {},
                rules: {
                    me: {
                        methods: ['oauth']
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {json: function() {
                    }}, null);
            }

            return expect(fn).to.throw("oauth middleware wasn\'t configured");
        });

        it('should throw an error because we use unknow method', function() {

            var security = require('../src/security')({
                methods: {},
                rules: {
                    me: {
                        methods: ['foo']
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {json: function() {
                    }}, null);
            }

            return expect(fn).to.throw("\"foo\" is not a validation method");
        });

        it('should throw an error because we add a method without validation method', function() {

            var security = require('../src/security')({
                methods: {
                    failure: {
                        config: {
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['failure']
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {json: function() {
                    }}, null);
            }

            return expect(fn).to.throw("unknow validation method for key failure");
        });

        it('should throw an error because we extends an unknow methods', function() {

            var security = require('../src/security')({
                methods: {
                    failure: {
                        extends: 'foo'
                    }
                },
                rules: {
                    me: {
                        methods: ['failure']
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {json: function() {
                    }}, null);
            }

            return expect(fn).to.throw("unknow validation method for key failure");
        });

        it('should throw an error because we add a validation method which are not an promise', function() {

            var security = require('../src/security')({
                methods: {
                    failure: {
                        validation: function(config, req, res) {
                            return true;
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['failure']
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {json: function() {
                    }}, null);
            }

            return expect(fn).to.throw("middleware is not an promise");
        });

        it('should throw an error because we add methods for unknow folder', function() {

            var fn = function() {
                var security = require('../src/security')({
                    pathMiddlewares: "",
                    methods: {
                    },
                    rules: {
                    }
                });
            }

            return expect(fn).to.throw("Invalid path: ''");
        });

    });


    describe('Check middlewares ', function() {


        it('should have default middlewares ', function() {

            var security = require('../src/security')({
                methods: {
                },
                rules: {
                    me: {
                        methods: ['oauth']
                    }
                }
            });
            security.validate();

            expect(security.allowedMethodNames).to.contain('http');
            expect(security.allowedMethodNames).to.contain('guest');
            expect(security.allowedMethodNames).to.contain('oauth');
            expect(security.validationsForMethod).to.contain.keys('http');
            expect(security.validationsForMethod).to.contain.keys('guest');
            expect(security.validationsForMethod).to.contain.keys('oauth');
        });


        it('should have middleware defined in file', function() {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                },
                rules: {
                    me: {
                        methods: ['dummy']
                    }
                }
            });
            security.validate();

            expect(security.allowedMethodNames).to.contain('dummy');
            expect(security.validationsForMethod).to.contain.keys('dummy');
        });


        it('should pass an dummy test', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                },
                rules: {
                    me: {
                        methods: ['dummy']
                    }
                }
            });
            security.validate();

            var req = {};
            security.getSecurityMiddleware("me")(req, {json: function() {

                }}, function() {

                if (req.user != undefined && req.user.id == "1000") {
                    done()
                } else {
                    done(new Error("dummy must set an user on req.user"))
                }
            });

        });

        it('should pass an http test', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    http: {
                        config: {
                            user: "Aladdin",
                            password: "open sesame"
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['http']
                    }
                }
            });
            security.validate();

            var req = {
                headers: {
                    authorization: "Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=="
                }
            };

            security.getSecurityMiddleware("me")(req,
                    {
                        json: function(statusCode, message) {
                            if (statusCode == 401) {
                                done(new Error("received " + statusCode + " " + message))
                            }
                        }
                    },
            function() {
                if (req.user != undefined) {
                    done()
                } else {
                    done(new Error("http must set an user on req.user"))
                }
            });

        });

        it('should failed an http test', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    http: {
                        config: {
                            user: "Aladdin",
                            password: "open sesame"
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['http']
                    }
                }
            });
            security.validate();

            var req = {
                headers: {
                    authorization: "Basic dzdzdd=="
                }
            };

            security.getSecurityMiddleware("me")(req,
                    {
                        json: function(statusCode, message) {
                            if (statusCode == 401) {
                                done()
                            }
                        }
                    },
            function() {
                done(new Error("middleware has said 'ok you are clean' but it's not the case .."));
            });

        });

        it('should pass an oauth test', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me"
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['oauth']
                    }
                }
            });
            security.validate();

            var req = {
                headers: {},
                query: {
                    access_token: "user_a"
                }
            };

            security.getSecurityMiddleware("me")(req,
                    {
                        json: function(statusCode, message) {
                            if (statusCode == 401) {
                                done(new Error("received " + statusCode + " " + message))
                            }
                        }
                    },
            function() {
                if (req.user != undefined) {
                    done()
                } else {
                    done(new Error("oauth must set an user on req.user"))
                }
            });

        });

        it('should pass an oauth test with custom accessTokenExtractor ', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me",
                            accessTokenExtractor: function(config, req, res) {
                                return req.query.at;
                            }
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['oauth']
                    }
                }
            });
            security.validate();

            var req = {
                headers: {},
                query: {
                    at: "user_a"
                }
            };

            security.getSecurityMiddleware("me")(req,
                    {
                        json: function(statusCode, message) {
                            if (statusCode == 401) {
                                done(new Error("received " + statusCode + " " + message))
                            }
                        }
                    },
            function() {
                if (req.user != undefined) {
                    done()
                } else {
                    done(new Error("oauth must set an user on req.user"))
                }
            });

        });


        it('should pass an oauth test with invalid token', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me"
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['oauth']
                    }
                }
            });
            security.validate();

            security.getSecurityMiddleware("me")({
                headers: {},
                query: {
                    access_token: "invalidtoken"
                }
            },
            {
                json: function(statusCode, message) {
                    if (statusCode == 401) {
                        done()
                    }
                }
            },
            function() {
                done(new Error("middleware has said 'ok you are clean' but it's not the case .."));
            });

        });


        it('should pass an oauth test + userMe with "or" mode', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    user_is_me: {
                        config: {
                            userId: "1"
                        }
                    },
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me"
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['oauth', 'user_is_me']
                    }
                }
            });
            security.validate();

            security.getSecurityMiddleware("me")({
                headers: {},
                query: {
                    access_token: "user_a"
                }
            },
            {
                json: function(statusCode, message) {
                    if (statusCode == 401) {
                        done(new Error("received " + statusCode + " " + message))
                    }
                }
            },
            function() {
                done();
            });

        });

        it('should pass an oauth test + userMe with "and" mode', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    user_is_me: {
                        config: {
                            userId: "1"
                        }
                    },
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me"
                        }
                    }
                },
                rules: {
                    me: {
                        methodsMode: "and",
                        methods: ['oauth', 'user_is_me']
                    }
                }
            });
            security.validate();

            security.getSecurityMiddleware("me")({
                headers: {},
                query: {
                    access_token: "user_a"
                }
            },
            {
                json: function(statusCode, message) {
                    if (statusCode == 401) {
                        done(new Error("received " + statusCode + " " + message))
                    }
                }
            },
            function() {
                done();
            });

        });


        it('should failed an oauth test + userMe with "and" mode', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    user_is_me: {
                        config: {
                            userId: "2"
                        }
                    },
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me"
                        }
                    }
                },
                rules: {
                    me: {
                        methodsMode: "and",
                        methods: ['oauth', 'user_is_me']
                    }
                }
            });
            security.validate();

            security.getSecurityMiddleware("me")({
                headers: {},
                query: {
                    access_token: "user_a"
                }
            },
            {
                json: function(statusCode, message) {
                    if (statusCode == 401) {
                        done();
                    }
                }
            },
            function() {
                done(new Error("middleware has said 'ok you are clean' but it's not the case .."));
            });

        });



        it('should failed an oauth test + userMe with "and" mode', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    user_is_me: {
                        config: {
                            userId: "2"
                        }
                    },
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me"
                        }
                    }
                },
                rules: {
                    me: {
                        methodsMode: "and",
                        methods: ['user_is_me', 'oauth']
                    }
                }
            });
            security.validate();

            security.getSecurityMiddleware("me")({
                headers: {},
                query: {
                    access_token: "user_a"
                }
            },
            {
                json: function(statusCode, message) {
                    if (statusCode == 401) {
                        done();
                    }
                }
            },
            function() {
                done(new Error("middleware has said 'ok you are clean' but it's not the case .."));
            });

        });


        it('should failed with incorrect name validation on rules', function() {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                },
                rules: {
                    me: {
                        methods: [{
                            }]
                    }
                }
            });

            var fn = function() {
                security.validate();
            }

            return expect(fn).to.throw("you must specified key for validation method on rule");

        });

        it('should failed with missing validation function on rules', function() {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                },
                rules: {
                    me: {
                        methods: [{
                                onlyPair: {
                                }
                            }]
                    }
                }
            });

            var fn = function() {
                security.validate();
            }

            return expect(fn).to.throw("unknow validation method for key onlyPair");

        });


        it('should failed with not function validation on rules', function() {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                },
                rules: {
                    me: {
                        methods: [{
                                onlyPair: {
                                    validation: true
                                }
                            }]
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {}, null);
            }

            return expect(fn).to.throw("validation method for key onlyPair are not an function");

        });


        it('should failed with not promise validation function on rules', function() {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                },
                rules: {
                    me: {
                        methods: [{
                                onlyPair: {
                                    validation: function() {

                                    }
                                }
                            }]
                    }
                }
            });

            var fn = function() {
                security.validate();
                security.getSecurityMiddleware("me")({}, {}, null);
            }

            return expect(fn).to.throw("middleware is not an promise");

        });

        it('should success with promise validation function on rules', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                },
                rules: {
                    me: {
                        methods: [{
                                onlyPair: {
                                    validation: function(config, req, res) {
                                        return new Promise(function(resolve, reject) {
                                            return resolve();
                                        })
                                    }
                                }
                            }]
                    }
                }
            });

            security.validate();
            security.getSecurityMiddleware("me")({
            },
                    {
                        json: function(statusCode, message) {
                            if (statusCode == 401) {
                                done(new Error("received " + statusCode + " " + message))
                            }
                        }
                    },
            function() {
                done();
            });

        });

        it('should override oauth', function(done) {

            var security = require('../src/security')({
                pathMiddlewares: process.cwd() + "/test/middlewares",
                methods: {
                    oauth: {
                        config: {
                            secretKey: "dontmakeinproduction"
                        },
                        validation: function(config, req, res) {
                            return new Promise(function(resolve, reject) {
                                if (req.query.secret == config.secretKey) {
                                    return resolve();
                                }
                            })
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ["oauth"]
                    }
                }
            });

            security.validate();
            security.getSecurityMiddleware("me")({
                query: {
                    secret: "dontmakeinproduction"
                }
            },
                    {
                        json: function(statusCode, message) {
                            if (statusCode == 401) {
                                done(new Error("received " + statusCode + " " + message))
                            }
                        }
                    },
            function() {
                done();
            });

        });

        it('should worked with extended method', function(done) {

            var security = require('../src/security')({
                methods: {
                    oauth: {
                        config: {
                            endpoint: "http://localhost:3000/me",
                        }
                    },
                    custom: {
                        extends: 'oauth',
                        config: {
                            accessTokenExtractor: function(config, req, res) {
                                return req.query.at;
                            }
                        }
                    }
                },
                rules: {
                    me: {
                        methods: ['custom']
                    }
                }
            });

            security.validate();
            security.getSecurityMiddleware("me")({
                query: {
                    at: "user_a"
                }
            },
            {
                json: function(statusCode, message) {
                    if (statusCode == 401) {
                        done(new Error("received " + statusCode + " " + message))
                    }
                }
            },
            function() {
                done();
            });

        });
    });
})

