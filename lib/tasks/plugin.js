var fs = require('fs'),
    path = require('path'),
    config = require('../config')(),
    plugin = require('../plugin'),
    exec = require('child_process').exec;

var pluginTask = function() {
    'use strict';


    var plugins = plugin.search();
    var data = [];
    this.report('header', 'Installed plugins:');

    for (var i in plugins) {
        var p = plugins[i];
        data.push({
            name: p.name,
            description: p.description,
            version: p.version,
            visibility: '(' + p.visibility + ')'
        });
    }

    if (data.length) {
        this.report('data', data);
    } else {
        this.report('empty', '(none)');
    }
};

pluginTask.description = 'Show installed plugins';

module.exports = pluginTask;