var path = require('path'),
    fs = require('fs'),
    objectUtil = require('./object');

var manifestCache = {};

module.exports = function(cwd, options) {
    'use strict';

    options = options || {};

    if (!options.noCache && manifestCache[cwd]) {
        return manifestCache[cwd];
    }

    var manifestFile = path.join(cwd, 'pas.json');
    var manifest;

    try {
        if (fs.existsSync(manifestFile)) {
            manifest = objectUtil.copy(require(manifestFile));
        }
    } catch(e) {
        console.error('<e>', e.stack);
    }

    try {
        if (options.env) {
            var file = path.join(cwd, 'pas-' + options.env + '.json');
            if (fs.existsSync(file)) {
                var envManifest = require(file);
                merge(manifest, envManifest);
            }
        }
    } catch(e) {
        console.error('<e>', e.stack);
    }

    manifestCache[cwd] = manifest;

    return manifest;
};

var merge = function(to, from) {
    for(var i in from) {
        var f = i.split('!'),
            key = f[0],
            action = f.length === 1 ? 'merge' : f[1];

        if (action === 'unset') {
            delete to[key];
        } else if (action === 'set') {
            to[key] = copy(from[i]);
        } else if (typeof from[key] === 'object' && !Array.isArray(from[key])) {
            if (typeof to[key] !== 'object' || Array.isArray(from[key])) {
                to[key] = {};
            }
            merge(to[key], from[key]);
        } else {
            to[key] = from[key];
        }
    }
};