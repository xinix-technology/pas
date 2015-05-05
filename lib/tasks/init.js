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

    var manifestName = this.opts.n || this.opts.name,
        manifestVersion = this.opts.v || this.opts.version,
        manifestProfile = this.opts.p || this.opts.profile;

    // validate manifestName
    if (manifestName && manifestName.split('/').length !== 2) {
        manifestName = 'my/' + manifestName;
    }

    switch (this.args.length) {
        case 0:
            var manifestFile = path.join(config.cwd, 'pas.json');
            if (fs.existsSync(manifestFile)) {
                throw new Error('Package already initialized');
            }

            var manifest = {
                name: manifestName || 'my/package',
                version: manifestVersion || '0.0.1',
                profile: manifestProfile || 'unknown',
                dependencies: {}
            };
            fs.writeFileSync('./pas.json', JSON.stringify(manifest, null, 4));
            break;
            // return Promise.reject(new Error('No archetype specified'));
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

            var defaultCwd = config.cwd;

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
                })
                .then(function() {
                    config.cwd = defaultCwd;
                });

    }
};

initTask.description = 'Initialize new package for development';
