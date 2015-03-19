var query = require('../../query');

var deployListTask = module.exports = function() {
    'use strict';

    return query().then(function(p) {
        this.report('header', 'Deploy:');
        this.report('data', p.deploy);
    }.bind(this));
};