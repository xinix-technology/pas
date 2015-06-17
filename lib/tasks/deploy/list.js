var query = require('../../query');

var deployListTask = module.exports = function() {
    'use strict';

    return query().then(function(p) {
        log.i('header', 'Deploy:');
        log.i('data', p.deploy);
    }.bind(this));
};