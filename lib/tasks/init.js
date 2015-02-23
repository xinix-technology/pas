var mkdirp = require('../fsutil').mkdirp,
    cp = require('../fsutil').cp,
    query = require('../query'),
    config = require('../config')(),
    path = require('path'),
    fs = require('fs'),
    task = require('../task'),
    semver = require('semver'),
    tmp = require('tmp'),
    Promise = require('promise'),
    request = require('request');

tmp.setGracefulCleanup();

var Init = function() {
    'use strict';
};

Init.prototype.exec = function() {
    'use strict';


    switch (this.args.length) {
        case 0:
            return Promise.reject(new Error('No archetype specified'));
        default:
            var pUrl = this.args[0],
                baseDir = this.args[1] || '.';

            var cwd = path.join(config.cwd, baseDir);
            if (fs.existsSync(cwd) && fs.readdirSync(cwd).length > 0) {
                return Promise.reject(new Error('Directory is not empty, cannot proceed init'));
            }

            mkdirp(path.join(cwd, '..'));

            config.cwd = cwd;

            var p;
            return query(pUrl)
                .then(function(q) {
                    p = q.get();
                    return task({ _: ['pull', p] });
                })
                .then(function() {
                    cp(p.baseDir, baseDir);

                    return task({ _: ['install'] });
                })
                .then(function() {
                    this.report('message', 'Initialized with %s', p.name);
                }.bind(this));

    }
};

module.exports = new Init();