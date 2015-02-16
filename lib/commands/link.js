var path = require('path'),
    semver = require('semver'),
    rimraf = require('rimraf'),
    fs = require('fs'),
    name = require('../name');

var mkdirp = function(dir) {
    'use strict';

    if (!fs.existsSync(dir)) {
        var s = '/';
        dir.split(path.sep).forEach(function(p) {
            p = path.join(s, p);

            if (!fs.existsSync(p)) {
                fs.mkdirSync(p);
            }
            s = p;
        });
    }
};

var LinkCmd = function() {
    'use strict';

    this.description = 'Link local directory as repository package';
};

LinkCmd.prototype.exec = function(cb) {
    'use strict';

    if (this.params.length === 0) {
        this.provideLink(cb);
    } else {
        this.consumeLink(cb);
    }
};

LinkCmd.prototype.consumeLink = function(cb) {
    'use strict';

    this.params.forEach(function(param) {
        try {
            var q = name.query(param),
                localPackageDir = path.join(this.config('repository'), q.vendor, q.name),
                localPackagePath,
                profile,
                vendorPackagePath,
                ls,
                versions = [],
                version = q.version;

            if (!fs.existsSync(localPackageDir)) {
                return cb(new Error(param + ' not found'));
            }

            if (!version) {
                // if dev allowed
                if (fs.existsSync(path.join(localPackageDir, 'dev-master'))) {
                    version = 'dev-master';
                } else {
                    ls = fs.readdirSync(localPackageDir);
                    ls.forEach(function(file) {
                        if (file.indexOf('dev-') !== 0) {
                            versions.push(file);
                        }
                    });
                    version = semver.maxSatisfying(versions, q.version);
                }
            }

            if (!version) {
                return cb(new Error(param + ' unsatisfied'));
            }

            localPackagePath = path.join(localPackageDir, version);
            try {
                profile = require(path.join(localPackagePath, 'reek.json')).profile || 'unknown';
            } catch(e) {
                profile = 'unknown';
            }

            vendorPackagePath = path.resolve(
                this.package('profiles')[profile].directory,
                q.vendor,
                q.name
            );

            if (fs.existsSync(vendorPackagePath)) {
                rimraf.sync(vendorPackagePath);
                // fs.unlinkSync(vendorPackagePath);
            }

            mkdirp(path.dirname(vendorPackagePath));
            fs.symlinkSync(localPackagePath, vendorPackagePath);

            this.message('result', '%s/%s:%s linked', q.vendor, q.name, version);
            cb();
        } catch(e) {
            cb(new Error('Cannot link ' + param));
        }
    }.bind(this));

};

LinkCmd.prototype.provideLink = function(cb) {
    'use strict';

    if (this.package('initialized')) {
        var localPackagePath = path.join(
            this.config('repository'),
            this.package('name'),
            'dev-master'
        );

        if (!fs.existsSync(localPackagePath)) {
            mkdirp(path.dirname(localPackagePath));
            fs.symlinkSync(this.config('cwd'), localPackagePath);

            this.message('result', '%s:%s linked', this.package('name'), 'dev-master');
        } else {
            this.message('result', '%s:%s already linked', this.package('name'), 'dev-master');
        }
        cb();
    } else {
        cb(new Error('Current package is uninitialized yet.'));
    }
};

module.exports = new LinkCmd();