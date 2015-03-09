var config = require('../config')(),
    query = require('../query');

var infoTask = module.exports = function() {
    'use strict';

    return query()
        .then(function(q) {

            var p = q.get();

            var data = {};
            data.name = p.name;
            data.version = p.version;

            this.report('header', 'Information:');
            this.report('data', data);

            data = [];
            Object.keys(p.dependencies).forEach(function(k) {
                var v = p.dependencies[k];
                data.push({
                    name: k,
                    version: v
                });
            });

            this.report('header', 'Dependencies:');
            this.report('data', data);
        }.bind(this));
};