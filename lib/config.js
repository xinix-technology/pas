var exec = require('child_process').exec,
    path = require('path'),
    mkdirp = require('./fsutil').mkdirp,
    fs = require('fs');

var manifest = require(path.join(__dirname, '..', 'package.json'));

var cached = {
    version: manifest.version,
    cwd: process.cwd(),
    home: process.env.PAS_HOME ? process.env.PAS_HOME : path.join(process.env.HOME, '.pas'),
    providerHome: '',
    pluginHome: '',
    debug: false,
    online: true,
    defaultProvider: 'github',
    providerOrder: ['local', 'github', 'packagist', 'git', 'http'],
    providers: {},
};

var isInitialized = false;

var config = module.exports = function() {
    'use strict';

    return cached;
};


config.init = function() {
    'use strict';

    if (isInitialized) return Promise.resolve();

    isInitialized = true;

    cached.providerHome = path.join(cached.home, 'providers');
    mkdirp(cached.providerHome);

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