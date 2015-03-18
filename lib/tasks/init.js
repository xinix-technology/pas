var mkdirp = require('../fsutil').mkdirp,
    cp = require('../fsutil').cp,
    rm = require('../fsutil').rm,
    query = require('../query'),
    config = require('../config')(),
    path = require('path'),
    task = require('../task'),
    fs = require('fs');

var initTask = module.exports = function(pUrl, baseDir) {

    'use strict';

    switch (this.args.length) {
        case 0:
            return Promise.reject(new Error('No archetype specified'));
        default:
            baseDir = baseDir || '.';

            var cwd;

            if (baseDir[0] === '/') {
                cwd = baseDir;
            } else {
                cwd = path.join(config.cwd, baseDir);
            }

            if (fs.existsSync(cwd) && fs.readdirSync(cwd).length > 0) {
                return Promise.reject(new Error('Directory is not empty, cannot proceed init'));
            }

            mkdirp(path.join(cwd, '..'));

            config.cwd = cwd;

            var p;

            return query(pUrl)
                .then(function(localP) {
                    p = localP;
                    return task({ _: ['pull', p] });
                })
                .then(function() {
                    return cp(p.baseDir, baseDir, true);
                })
                .then(function() {
                    return task({ _: ['install'] });
                });

    }
};

initTask.description = 'Initialize new package for development';
