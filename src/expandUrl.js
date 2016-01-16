"use strict";

var Promise = require('bluebird');
var request = require('request');
var query = Promise.promisify(request.get, {context: request});

/**
 * @param short url to get redirect for
 * @returns {Promise}
 */
module.exports = function(short) {
    return query(short, null)
        .then(res => res.request.uri.href)
        .catch(err => short);
};