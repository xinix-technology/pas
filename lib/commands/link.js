var path = require('path'),
    fs = require('fs');

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
};

LinkCmd.prototype.exec = function(cb) {
    'use strict';

    var repository = this.reek.options.repository,
        params = this.options._.slice(1),
        pkg,
        repoPkg,
        repoPkgDir;

    if (params.length === 0) {
        if (this.reek.package.initialized) {
            pkg = this.reek.package;

            repoPkg = path.join(repository, pkg.name, pkg.version);

            if (!fs.existsSync(repoPkg)) {
                mkdirp(path.dirname(repoPkg));
                fs.symlinkSync(this.reek.options.cwd, repoPkg);

                this.message('result', '%s:%s linked', pkg.name, pkg.version);
            } else {
                this.message('result', '%s:%s already linked', pkg.name, pkg.version);
            }
            cb();
        } else {
            cb(new Error('Current package is uninitialized yet.'));
        }
    } else {
        params.forEach(function(param) {
            try {
                var resolved = this.resolve(param);
                if (resolved) {
                    var pkg = path.join(this.reek.options.repository, param, resolved.version),
                        pkgConf = require(path.join(pkg, 'reek.json')),
                        profile = pkgConf.profile || 'unknown',
                        profileDir = this.reek.package.profiles[profile].directory,
                        dest = path.resolve(profileDir, resolved.name);

                    if (fs.existsSync(dest)) {
                        this.message('result', '%s:%s already linked', resolved.name, resolved.version);
                        return;
                    }

                    mkdirp(path.dirname(dest));
                    fs.symlinkSync(pkg, dest);

                    this.message('result', '%s:%s linked', resolved.name, resolved.version);
                }
            } catch(e) {
                this.message('warning', 'Cannot link "%s"', param);
            }
        }.bind(this));

        cb();
    }
};

LinkCmd.prototype.resolve = function(link) {
    var splitted = link.split(':'),
        version = splitted[1] || '',
        versions;

    link = splitted[0];

    if (!~link.indexOf('/')) {
        throw new Error('Package not found.');
    }

    var pkgDir = path.join(this.reek.options.repository, link);

    if (!fs.existsSync(pkgDir)) {
        throw new Error('Package not found.');
        return;
    }

    versions = fs.readdirSync(pkgDir);
    return {
        name: link,
        version: versions[versions.length - 1]
    };
};

module.exports = new LinkCmd();