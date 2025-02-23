"use strict";

var Promise = require('bluebird');
var basic_auth = require('http-auth');

module.exports = {
    name: 'http',
    config: {
        user: null,
        password: null,
        realm: null
    },
    middleware: function(config, req, res) {

        if (config.user == undefined || config.user == null) {
            throw new Error("http basic middleware wasn't configure");
        }

        return new Promise(function(resolve, reject) {
            var reg = new RegExp("^basic ");
            var authorization = req.headers.authorization;
            if (authorization && reg.test(authorization.toLowerCase())) {
                var auth = basic_auth.basic({
                    realm: config.realm
                }, function(username, password, callback) { // Custom authentication method.
                    callback(username === config.user && password === config.password);
                });

                auth.isAuthenticated(req, function(result) {
                    if (result && result.user != undefined) {
                        return resolve({
                            username: result.user
                        });
                    } else {
                        return reject();
                    }
                })

                // return basic_auth.connect(auth)(req, res, next);
            } else {
                return reject();
            }

        })
    }

}