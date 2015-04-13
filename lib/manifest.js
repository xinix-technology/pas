var path = require('path'),
    config = require('./config')();

var manifestCache = {};

module.exports = function(cwd, nocache) {
    'use strict';

    cwd = cwd || config.cwd;

    if (!nocache && manifestCache[cwd]) {
        return manifestCache[cwd];
    }

    var copy = function(from) {
        var result = {};
        for(var key in from) {
            if (typeof from[key] === 'object' && !Array.isArray(from[key])) {
                result[key] = copy(from[key]);
            } else {
                result[key] = from[key];
            }
        }

        return result;
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

    var manifestFile = path.join(cwd, 'pas.json');
    var manifest;

    try {
        manifest = copy(require(manifestFile));
    } catch(e) {
        // console.error(e.message);
    }

    try {
        var envManifest = require(path.join(cwd, 'pas-' + config.env + '.json'));
        merge(manifest, envManifest);
    } catch(e) {
        // console.error(e.message);
    }

    manifestCache[cwd] = manifest;

    return manifest;
};