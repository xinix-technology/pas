var path = require('path'),
    fs = require('fs'),
    config = require('./config')(),
    profile = require('./profile'),
    mkdirp = require('./fsutil').mkdirp,
    rm = require('./fsutil').rm,
    semver = require('semver');

var manifestCache = {};

var Package = module.exports = function(q, version) {
    'use strict';

    var baseDir = q.isWorkingPackage ? config.cwd : q.provider.getDirectory(q.name, version);

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
        modules: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: [],
        },
        deploy: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: {}
        },
        profile: {
            enumerable: false,
            writable: true,
            configurable: false
        },
    });
};

Package.prototype.populateData = function() {
    'use strict';

    if (fs.existsSync(this.baseDir)) {
        return this.getProfile().readManifest(this.baseDir)
            .then(function(manifest) {
                for(var i in manifest) {
                    if (i === 'profile' || i === 'version') {
                        continue;
                    }
                    if (i === 'name' && !this.isWorkingPackage) {
                        continue;
                    }
                    this[i] = manifest[i];
                }
            }.bind(this));
    } else {
        return Promise.resolve();
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

    return this.populateData()
        .then(function() {
            return this;
        }.bind(this));
};

Package.prototype.pull = function() {
    'use strict';


    var to = this.query.provider.getDirectory(this.name, this.version),
        type = semver.valid(this.version) ? 'releases' : 'devs';

    var from = this.query.indices[type][this.version];

    if (type === 'releases' && fs.existsSync(to)) {
        return;
    }

    return this.query.provider.pull(from, to)
        .then(function() {
            return this.populateData();
        }.bind(this));
};

Package.prototype.readManifest = function() {
    'use strict';

    var manifestFile = path.join(config.cwd, 'pas.json');
    var manifest = require(manifestFile);
    return manifest;
};

Package.prototype.writeManifest = function(manifest) {
    'use strict';

    var manifestFile = path.join(config.cwd, 'pas.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    delete require.cache[manifestFile];
};

Package.prototype.getCacheDirectory = function() {
    'use strict';

    return this.query.provider.getDirectory(this.name, this.version);
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

Package.prototype.getInstalledVersion = function() {
    'use strict';

    var vendorDir = this.getInstalledDirectory();
    if (fs.existsSync(vendorDir)) {
        var realPath = fs.realpathSync(vendorDir);
        return path.basename(realPath);
    } else {
        return '';
    }
};

Package.prototype.getInstalledDirectory = function() {
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
            destination = otherPackage.getInstalledDirectory();

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

    var packagePath = otherPackage.getInstalledDirectory();
    if (fs.existsSync(packagePath)) {
        return rm(packagePath);
    }
};


Package.manifest = function(cwd, nocache) {
    'use strict';

    cwd = cwd || config.cwd;

    if (!nocache && manifestCache[cwd]) {
        return manifestCache[cwd];
    }

    var copy = function(from) {
        var result = {};
        for(var key in from) {
            if (typeof from[key] === 'object' && !Array.isArray(from[key])) {
                result[key] = copy(from[key]);
            } else {
                result[key] = from[key];
            }
        }

        return result;
    };

    var merge = function(to, from) {
        for(var i in from) {
            var f = i.split('!'),
                key = f[0],
                action = f.length === 1 ? 'merge' : f[1];

            if (action === 'unset') {
                delete to[key];
            } else if (action === 'set') {
                to[key] = copy(from[i]);
            } else if (typeof from[key] === 'object' && !Array.isArray(from[key])) {
                if (typeof to[key] !== 'object' || Array.isArray(from[key])) {
                    to[key] = {};
                }
                merge(to[key], from[key]);
            } else {
                to[key] = from[key];
            }
        }
    };

    var manifestFile = path.join(cwd, 'pas.json');
    var manifest = copy(require(manifestFile));

    try {
        var envManifest = require(path.join(cwd, 'pas-' + config.env + '.json'));
        merge(manifest, envManifest);
    } catch(e) {
        console.log(e.message);
    }

    manifestCache[cwd] = manifest;

    return manifest;
};
