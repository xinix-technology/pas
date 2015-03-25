var task = require('../../task'),
    path = require('path'),
    fs = require('fs'),
    query = require('../../query'),
    config = require('../../config')();

var addTask = module.exports = function(packageUrl, dir) {
    'use strict';

    if (!packageUrl) {
        throw new Error('No archetype specified');
    }

    if (!dir) {
        throw new Error('No destination directory specified');
    }

    if (fs.existsSync(dir)) {
        throw new Error('Directory already initialized or not empty');
    }

    var p;
    return query().then(function(pArg) {
            p = pArg;
            return task({_:['init', packageUrl, dir]});
        })
        .then(function() {
            var manifest = p.readManifest();

            manifest.modules = manifest.modules || [];

            var modules = [];

            manifest.modules.forEach(function(m) {
                if (modules.indexOf(m) === -1) {
                    modules.push(m);
                }
            });

            if (modules.indexOf(dir) === -1) {
                modules.push(dir);
            }

            manifest.modules = modules;

            p.writeManifest(manifest);

            this.report('message', '[%s] module initialized from %s', p.name, packageUrl);
        }.bind(this));
};