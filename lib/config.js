var Promise = require('promise'),
    exec = require('child_process').exec,
    path = require('path'),
    fs = require('fs');

var cached = {};


var config = function() {
    'use strict';

    return cached;
};

config.init = function() {
    'use strict';

    var manifest = require(path.join(__dirname, '..', 'package.json'));

    cached.version = manifest.version;
    cached.home = process.env.PAS_HOME ? process.env.PAS_HOME : path.join(process.env.HOME, '.pas');
    cached.providerHome = path.join(cached.home, 'providers');
    cached.cwd = process.cwd();

    return new Promise(function(resolve, reject) {
            if (process.env.PAS_PLUGIN_HOME) {
                cached.pluginHome = process.env.PAS_PLUGIN_HOME;
            } else {
                exec('npm prefix -g', function(err, prefix) {
                    if (err) {
                        return reject(err);
                    }

                    cached.pluginHome = path.join(prefix.trim(), 'lib', 'node_modules');
                    resolve();
                });
            }
        })
        .then(function() {
            try {
                var config = require(path.join(cached.home, 'config.json'));
                for(var i in config) {
                    cached[i] = config[i];
                }
            } catch(e) {}

            cached.debug = process.env.PAS_DEBUG > 0 ? true : false;
            cached.online = process.env.PAS_OFFLINE > 0 ? false : true;
        });

};

module.exports = config;