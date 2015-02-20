var mkdirp = require('../fsutil').mkdirp,
    query = require('../query'),
    config = require('../config')(),
    path = require('path'),
    fs = require('fs'),
    task = require('../task'),
    semver = require('semver'),
    tmp = require('tmp'),
    request = require('request'),
    index = require('../index');

tmp.setGracefulCleanup();

var Init = function() {
    'use strict';
};

Init.prototype.exec = function(cb) {
    'use strict';

    switch (this.args.length) {
        case 0:
            return cb(new Error('No archetype specified'));
        default:
            var pUrl = this.args[0],
                baseDir = this.args[1] || '.';

            var cwd = path.join(config.cwd, baseDir);
            if (fs.existsSync(cwd) && fs.readdirSync(cwd).length > 0) {
                return cb(new Error('Directory is not empty, cannot proceed init'));
            }

            mkdirp(cwd);

            config.cwd = cwd;

            var q = query(pUrl);
            index(q.name, function(err, packageIndex) {
                packageIndex.archetypePull(q.version, cwd, function(err, version) {
                    if (err) {
                        return cb(err);
                    }

                    this.report('message', '%s#%s initialized at "%s"', q.name, version, cwd);

                    task({_:['install']}, cb);
                }.bind(this));
            }.bind(this));

    }
};

module.exports = new Init();