var mkdirp = require('../fsutil').mkdirp,
    cp = require('../fsutil').cp,
    query = require('../query'),
    config = require('../config')(),
    path = require('path'),
    task = require('../task'),
    fs = require('fs');

var initTask = {

    description: 'Initialize new package for development',

    exec: function() {
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
                    .then(function(localP) {
                        p = localP;
                        return task({ _: ['pull', p] });
                    })
                    .then(function() {
                        return cp(p.baseDir, baseDir);
                    })
                    .then(function() {
                        return task({ _: ['install'] });
                    });

        }
    }
};

module.exports = initTask;