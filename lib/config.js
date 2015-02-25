var path = require('path'),
    fs = require('fs'),
    manifest = require(path.join(__dirname, '..', 'package.json'));

var cached = {};

cached.version = manifest.version;
cached.home = process.env.PAS_HOME ? process.env.PAS_HOME : path.join(process.env.HOME, '.pas');
cached.provider = path.join(cached.home, 'providers');
cached.cwd = process.cwd();

try {
    var config = require(path.join(cached.home, 'config.json'));
    for(var i in config) {
        cached[i] = config[i];
    }
} catch(e) {}

cached.debug = process.env.PAS_DEBUG > 0 ? true : false;
cached.online = process.env.PAS_OFFLINE > 0 ? false : true;

var config = function() {
    'use strict';

    return cached;
};

module.exports = config;