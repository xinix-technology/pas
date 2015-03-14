var fs = require('fs'),
    path = require('path'),
    config = require('../config')(),
    exec = require('child_process').exec;

var pluginTask = function() {
    'use strict';

    var plugins = [];

    this.report('header', 'Installed plugins:');

    fs.readdirSync(config.pluginHome).forEach(function(f) {
        if (f.indexOf('pas-') === 0) {
            var description = '.';
            try {
                var plugin = require(path.join(config.pluginHome, f, 'package.json'));
                description = plugin.description;
            } catch(e) {}

            plugins.push({
                name: f.substr(4),
                description: description,
                visibility: 'global',
            });
        }
    });

    if (fs.existsSync('./node_modules')) {
        fs.readdirSync('./node_modules').forEach(function(f) {
            if (f.indexOf('pas-') === 0) {
                var description = '.';
                try {
                    var plugin = require(path.join(config.pluginHome, f));
                    description = plugin.description;
                } catch(e) {}

                plugins.push({
                    name: f.substr(4),
                    description: description,
                    visibility: 'local',
                });
            }
        });
    }

    this.report('data', plugins);
};

pluginTask.description = 'Show installed plugins';

module.exports = pluginTask;