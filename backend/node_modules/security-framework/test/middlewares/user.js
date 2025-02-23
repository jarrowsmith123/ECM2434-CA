"use strict";

var Promise = require('bluebird');

module.exports = {
    name: 'user_is_me',
    config: {
        userId: null
    },
    middleware: function(config, req, res) {

        if(config.userId == null) {
            throw new Error("user_is_me not configured");
        }
        
        return new Promise(function(resolve, reject) { 
            if (req.user.id == config.userId) {
                resolve();
            } else {
                reject();
            }
        });
    }
}