"use strict";

var request = require("request");
var Promise = require('bluebird');

module.exports = {
    name: 'oauth',
    config: {
        endpoint: "",
        accessTokenExtractor: function(config, req, res) {
            var oAuthAccessToken;
            
            var reg = new RegExp("^bearer ");
            var authorization = req.headers.authorization;
            if (authorization && reg.test(authorization.toLowerCase())) {
                oAuthAccessToken = authorization.toLowerCase().replace("bearer ", "");
            }

            if (req.query.access_token) {
                oAuthAccessToken = req.query.access_token;
            }

            return oAuthAccessToken;
        }
    },
    middleware: function(config, req, res) {

        if (config.endpoint == "") {
            throw new Error("oauth middleware wasn't configured")
        }

        return new Promise(function(resolve, reject) {
            var oAuthAccessToken = "";
 
            oAuthAccessToken = config.accessTokenExtractor(config, req, res);
 
            if (oAuthAccessToken != null) {

                request.get(config.endpoint, {
                    auth: {
                        bearer: oAuthAccessToken
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {

                        var user = JSON.parse(response.body);
                        return resolve(user);
                    } else {

                        return reject();
                    }
                });
            } else {
                return reject();
            }
        });
    }
}