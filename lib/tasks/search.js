var fs = require('fs'),
    path = require('path'),
    config = require('../config')();

var searchTask = module.exports = function() {
    'use strict';

    if (this.args.length === 0 || this.args[0] === '') {
        throw new Error('Usage: pas search [query]');
    }

    var q = this.args[0];

    var data = [];

    fs.readdirSync(config.providerHome).forEach(function(provider) {
        fs.readdirSync(path.join(config.providerHome, provider)).forEach(function(vendor) {
            fs.readdirSync(path.join(config.providerHome, provider, vendor)).forEach(function(unit) {
                data.push({
                    provider: provider,
                    name: vendor + '/' + unit
                });
            });
        });
    });

    var result = data.filter(function(row) {
        return row.name.indexOf(q) != -1;
    });

    this.report('header', 'Packages found:');
    this.report('data', result);
};

searchTask.description = 'Search archetypes';