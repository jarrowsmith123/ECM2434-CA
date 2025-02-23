"use strict";

var Promise = require('bluebird');

module.exports = {
    name: 'guest',
    config: {

    },
    middleware: function(config, req, res) {

        return new Promise(function(resolve, reject) {
            resolve();
        });
    }
}