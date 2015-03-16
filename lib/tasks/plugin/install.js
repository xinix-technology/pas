var tmp = require('tmp'),
    fs = require('fs'),
    cp = require('../../fsutil').cp,
    rm = require('../../fsutil').rm,
    config = require('../../config')(),
    path = require('path');

tmp.setGracefulCleanup();

var pluginInstallTask = module.exports = function(name) {
    'use strict';

    var npm = require('npm');
    var npmPackageName = 'pas-' + name,
        pluginPath = path.join(config.pluginHome, npmPackageName);

    if (fs.existsSync(pluginPath)) {
        rm(pluginPath);
    }

    return new Promise(function(resolve, reject) {
            tmp.dir({ keep: true }, function(err, dir, cleanupCallback) {
                Promise.denodeify(npm.load)({prefix:dir})
                    .then(function() {
                        return Promise.denodeify(npm.install)(npmPackageName);
                    })
                    .then(function() {
                        return cp(path.join(dir, 'node_modules', npmPackageName), pluginPath);
                    })
                    .then(function() {
                        cleanupCallback();
                        resolve();
                    }, function(e) {
                        cleanupCallback();
                        reject(e);
                    });
            });
        })
        .then(function() {
            console.log('done');
            console.log(arguments);
        });
};