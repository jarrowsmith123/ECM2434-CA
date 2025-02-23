"use strict";

var Promise = require('bluebird');

module.exports = {
    name: 'dummy',
    config: {

    },
    middleware: function(config, req, res) {

        return new Promise(function(resolve, reject) {
            resolve({id: "1000"});
        });
    }
}