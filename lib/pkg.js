var Promise = require('promise'),
    path = require('path'),
    fs = require('fs'),
    config = require('./config')(),
    profile = require('./profile'),
    mkdirp = require('./fsutil').mkdirp,
    rm = require('./fsutil').rm,
    semver = require('semver');
// var fs = require('fs'),
//     path = require('path'),
//     index = require('./index'),
//     config = require('./config')(),
//     profile = require('./profile');

// var CONF_FILENAME = 'reek.json';

var Package = function(meta) {
    'use strict';

    Object.defineProperties(this, {
        query: {
            enumerable: false,
            writable: true,
            configurable: false
        }
    });

    for(var i in meta) {
        this[i] = meta[i];
    }

    this.initialize();

};

Package.prototype.initialize = function() {
    'use strict';

    if (fs.existsSync(this.baseDir)) {
        this.profile = profile.detect(this);
        for(var i in this.profile.manifest) {
            if (!this[i]) {
                this[i] = this.profile.manifest[i];
            }
        }
    }
};

Package.prototype.pull = function() {
    'use strict';

    var to = path.join(config.provider, this.query.provider.name, this.name, this.version);
    var type = semver.valid(this.version) ? 'releases' : 'devs';
    var from = this.query.indices[type][this.version].url;

    if (fs.existsSync(to)) {
        return;
    }

    return this.query.provider.pull(from, to);
};

Package.prototype.readManifest = function(force) {
    'use strict';

    if (force) {
        delete require.cache[this.manifestFile];
    }

    return require(this.manifestFile);
};

Package.prototype.writeManifest = function(manifest) {
    'use strict';

    fs.writeFileSync(this.manifestFile, JSON.stringify(manifest, null, 2));
};

Package.prototype.getCacheDirectory = function(version) {
    'use strict';

    return path.join(config.provider, this.query.provider.name, this.name, this.version);
};

Package.prototype.createLink = function() {
    'use strict';

    var destinationDir = this.getCacheDirectory();

    if (!fs.existsSync(destinationDir)) {
        mkdirp(path.join(destinationDir, '..'));
        return Promise.denodeify(fs.symlink)(config.cwd, destinationDir);
    }
};

Package.prototype.deleteLink = function(cb) {
    'use strict';

    var linkCache = this.getCache('master');

    if (fs.existsSync(linkCache)) {
        fs.unlink(linkCache, cb);
    } else {
        cb();
    }
};

Package.prototype.getVendorDirectory = function() {
    'use strict';

    return path.join(config.cwd, this.profile.vendorDirectory, this.name);
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

Package.prototype.unlink = function(pkgUrl, cb) {
    'use strict';

    var cachePackage = pkg(pkgUrl),
        destination = path.join(config.cwd, cachePackage.getProfileData('directory'), cachePackage.name);

    if (fs.existsSync(destination)) {
        rm(destination);
    }

    cb(null, cachePackage);
};

module.exports = Package;
