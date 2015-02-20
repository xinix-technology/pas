var fs = require('fs'),
    path = require('path'),
    mkdirp = require('./fsutil').mkdirp,
    rm = require('./fsutil').rm,
    index = require('./index'),
    config = require('./config')(),
    pkgQuery = require('./query');

var CONF_FILENAME = 'reek.json';

var cache = {};

var Package = function(pkgUrl) {
    'use strict';

    var i,
        cfg = {},
        defaultCfg,
        query;

    this.url = pkgUrl;

    defaultCfg = require(path.join(__dirname, '..', CONF_FILENAME));

    for(i in defaultCfg) {
        this[i] = defaultCfg[i];
    }

    if (pkgUrl) {
        query = pkgQuery(pkgUrl);

        this.manifestFile = path.join(config.repository, query.name, query.version, CONF_FILENAME);

        try {
            cfg = this.readManifest();
        } catch(e) {
            cfg.name = query.name;
        }

        for(i in cfg) {
            this[i] = cfg[i];
        }

        this.queriedVersion = query.version;

        this.vendor = query.vendor;
        this.unit = query.unit;
    } else {
        this.manifestFile = path.join(config.cwd, CONF_FILENAME);

        try {
            cfg = this.readManifest();

            for(i in cfg) {
                this[i] = cfg[i];
            }

            this.queriedVersion = 'master';

            query = pkgQuery(this.name);
            this.vendor = query.vendor;
            this.unit = query.unit;
        } catch(e) {}
    }

    this.isInitialized = this.name ? true : false;
    this.isCurrentWork = pkgUrl ? false : true;
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

Package.prototype.getCache = function(version) {
    'use strict';

    return path.join(config.repository, this.name, version || this.queriedVersion);
};

Package.prototype.createLink = function(cb) {
    'use strict';

    var linkCache = this.getCache('link');

    if (!fs.existsSync(linkCache)) {
        mkdirp(path.join(linkCache, '..'));
        fs.symlink(config.cwd, linkCache, cb);
    } else {
        cb();
    }
};

Package.prototype.deleteLink = function(cb) {
    'use strict';

    var linkCache = this.getCache('link');

    if (fs.existsSync(linkCache)) {
        fs.unlink(linkCache, cb);
    } else {
        cb();
    }
};

Package.prototype.getProfileData = function(key) {
    'use strict';

    return this.profiles[this.profile][key];
};

Package.prototype.link = function(pkgUrl, cb) {
    'use strict';

    var cachePackage = pkg(pkgUrl),
        linkCache = cachePackage.getCache(),
        destination = path.join(config.cwd, cachePackage.getProfileData('directory'), cachePackage.name);

    if (fs.existsSync(destination)) {
        rm(destination);
    }

    if (fs.existsSync(linkCache)) {
        mkdirp(path.join(destination, '..'));
        fs.symlink(linkCache, destination, function(err) {
            cb(err, cachePackage);
        });
    }
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

var pkg = function(pkgUrl) {
    'use strict';

    pkgUrl = pkgUrl || '';

    if (!cache[pkgUrl]) {
        cache[pkgUrl] = new Package(pkgUrl);
    }

    return cache[pkgUrl] || null;
};

pkg.reset = function() {
    'use strict';

    cache = {};
};

pkg.Package = Package;

module.exports = pkg;
