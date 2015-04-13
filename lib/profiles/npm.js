var fs = require('fs'),
    path = require('path'),
    reporter = require('../reporter'),
    spawn = require('child_process').spawn;

var npmProfile = module.exports = {
    support: function(baseDir) {
        'use strict';

        if (fs.existsSync(path.join(baseDir, 'package.json'))) {
            return true;
        }
    }
};

npmProfile.postInstall = function(p) {
    'use strict';

    return new Promise(function(resolve, reject) {

        var npmInstall = spawn('npm', ['install'], {stdio: 'inherit'});

        npmInstall.on('close', function() {
            resolve();
        });
    }.bind(this));
};