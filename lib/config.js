var path = require('path'),
    fs = require('fs'),
    manifest = require(path.join(__dirname, '..', 'package.json'));

var cached = {};

cached.version = manifest.version;
cached.home = process.env.REEK_HOME ? process.env.REEK_HOME : path.join(process.env.HOME, '.reek');
cached.provider = path.join(cached.home, 'providers');
cached.cwd = process.cwd();

try {
    var config = require(path.join(cached.home, 'config.json'));
    for(var i in config) {
        cached[i] = config[i];
    }
} catch(e) {}

cached.debug = process.env.REEK_DEBUG > 0 ? true : false;
cached.online = process.env.REEK_OFFLINE > 0 ? false : true;

var config = function() {
    'use strict';

    return cached;
};

module.exports = config;