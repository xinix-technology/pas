var path = require('path'),
    fs = require('fs'),
    config = require('./config')(),
    profile = require('./profile'),
    mkdirp = require('./fsutil').mkdirp,
    rm = require('./fsutil').rm,
    semver = require('semver');

var Package = function(q, version) {
    'use strict';

    var baseDir = q.isWorkingPackage ? config.cwd : path.join(config.providerHome, q.provider.name, q.name, version);

    Object.defineProperties(this, {
        url: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: q.provider.normalizeUrl(q.name + '#' + version)
        },
        baseDir: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: baseDir,
        },
        name: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: q.name,
        },
        version: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: version,
        },
        isWorkingPackage: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: q.isWorkingPackage,
        },
        query: {
            enumerable: false,
            writable: true,
            configurable: false,
            value: q
        },
        dependencies: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: {},
        },
        profile: {
            enumerable: false,
            writable: true,
            configurable: false
        },
    });

    this.populateData();

    this.initialize();

};

Package.prototype.populateData = function() {
    'use strict';

    if (fs.existsSync(this.baseDir)) {
        var manifest = this.getProfile().readManifest(this.baseDir);

        for(var i in manifest) {
            if (i === 'profile' || i === 'version') {
                continue;
            }
            if (i === 'name' && !this.isWorkingPackage) {
                continue;
            }
            this[i] = manifest[i];
        }
    }
};

Package.prototype.getProfile = function() {
    'use strict';

    if (!this.profile) {
        this.profile = profile.detect(this.baseDir);
    }

    return this.profile;
};

Package.prototype.initialize = function() {
    'use strict';

    // if (fs.existsSync(this.baseDir)) {
    //     this.getProfile() = profile.detect(this);
    //     for(var i in this.getProfile().manifest) {
    //         if (!this[i]) {
    //             this[i] = this.getProfile().manifest[i];
    //         }
    //     }
    // }
};

Package.prototype.pull = function() {
    'use strict';


    var to = path.join(config.providerHome, this.query.provider.name, this.name, this.version),
        type = semver.valid(this.version) ? 'releases' : 'devs';

    var from = this.query.indices[type][this.version].url;

    if (type === 'releases' && fs.existsSync(to)) {
        return;
    }

    return this.query.provider.pull(from, to)
        .then(function() {
            this.populateData();
        }.bind(this));
};

// Package.prototype.readManifest = function(force) {
//     'use strict';

//     if (force) {
//         delete require.cache[this.manifestFile];
//     }

//     return require(this.manifestFile);
// };

Package.prototype.writeManifest = function(manifest) {
    'use strict';

    fs.writeFileSync(this.manifestFile, JSON.stringify(manifest, null, 2));
};

Package.prototype.getCacheDirectory = function(version) {
    'use strict';

    return path.join(config.providerHome, this.query.provider.name, this.name, this.version);
};

Package.prototype.createLink = function() {
    'use strict';

    var destinationDir = this.getCacheDirectory();

    if (!fs.existsSync(destinationDir)) {
        mkdirp(path.join(destinationDir, '..'));
        return Promise.denodeify(fs.symlink)(config.cwd, destinationDir);
    }
};

Package.prototype.deleteLink = function() {
    'use strict';

    var destinationDir = this.getCacheDirectory();

    return new Promise(function(resolve, reject) {

        if (fs.existsSync(destinationDir)) {
            fs.unlink(destinationDir, function(err) {
                if (err) return reject(err);
                resolve();
            });
        } else {
            resolve();
        }
    });
};

Package.prototype.getVendorDirectory = function() {
    'use strict';
    return path.join(config.cwd, this.getProfile().vendorDirectory, this.name);
};

Package.prototype.preInstall = function() {
    'use strict';

    if (this.getProfile().preInstall) {
        return Promise.resolve(this.getProfile().preInstall(this));
    }

    return Promise.resolve();
};

Package.prototype.postInstall = function() {
    'use strict';

    if (this.getProfile().postInstall) {
        return Promise.resolve(this.getProfile().postInstall(this));
    }
};

Package.prototype.link = function(otherPackage) {
    'use strict';

    return new Promise(function(resolve, reject) {
        var origin = otherPackage.getCacheDirectory(),
            destination = otherPackage.getVendorDirectory();

        if (fs.existsSync(destination)) {
            rm(destination);
        }

        if (fs.existsSync(origin)) {
            mkdirp(path.join(destination, '..'));
            fs.symlink(origin, destination, function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(null, otherPackage);
            });
        }
    }.bind(this));
};

Package.prototype.unlink = function(otherPackage) {
    'use strict';

    var packagePath = otherPackage.getVendorDirectory();
    if (fs.existsSync(packagePath)) {
        return rm(packagePath);
    }
};

module.exports = Package;
