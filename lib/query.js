var provider = require('./provider'),
    semver = require('semver'),
    path = require('path'),
    config = require('./config')(),
    url = require('url'),
    mkdirp = require('./fsutil').mkdirp,
    profile = require('./profile'),
    Package = require('./pkg'),
    fs = require('fs');

var queryCache = {};

var Query = function(queryUrl) {
    'use strict';

    Object.defineProperties(this, {
        url: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: queryUrl || ''
        },
        query: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: queryUrl || ''
        },
        name: {
            enumerable: true,
            writable: true,
            configurable: false
        },
        vendor: {
            enumerable: true,
            writable: true,
            configurable: false
        },
        unit: {
            enumerable: true,
            writable: true,
            configurable: false
        },
        version: {
            enumerable: true,
            writable: true,
            configurable: false
        },
        // baseDir: {
        //     enumerable: true,
        //     writable: true,
        //     configurable: false
        // },
        isWorkingPackage: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: false
        },
        'package': {
            enumerable: false,
            writable: true,
            configurable:false,
        },
        'indices': {
            enumerable: false,
            writable: true,
            configurable:false,
            value: {},
        },
        // profile: {
        //     enumerable: true,
        //     writable: true,
        //     configurable: false
        // },
        // provider: {
        //     enumerable: true,
        //     writable: true,
        //     configurable: false,
        // },
    });

    if (!queryUrl) {
        this.isWorkingPackage = true;

        var manifestFile = path.join(config.cwd, 'pas.json');
        if (fs.existsSync(manifestFile)) {
            var manifest = require(manifestFile);
            this.url = 'local:' + manifest.name + '#master';
        } else {
            this.url = 'local:';
        }
    } else {

    }

    this.provider = provider.detect(this.url);

    this.url = this.provider.normalizeUrl(this.url);

    this.parseUrl_();
};

Query.prototype.parseUrl_ = function() {
    'use strict';

    var parsed = url.parse(this.url);
    this.name = (parsed.hostname || '') + (parsed.pathname || '');
    this.version = parsed.hash ? decodeURIComponent(parsed.hash.substr(1)) : '';
    var splittedName = this.name.split('/');
    this.vendor = splittedName[0];
    this.unit = splittedName[1];

};

Query.prototype.getIndexFile = function() {
    'use strict';

    return path.join(config.providerHome, this.provider.name, this.name, 'indices.json');
};

Query.prototype.initialize = function() {
    'use strict';

    if (this.isWorkingPackage) {
        return Promise.resolve();
    }

    var indexFile = this.getIndexFile();

    return new Promise(function(resolve, reject) {
            fs.exists(indexFile, function(exists) {
                if (exists) {
                    resolve(require(indexFile));
                } else {
                    resolve(this.provider.fetchIndices(this.vendor, this.unit));
                }
            }.bind(this));
        }.bind(this))
        .then(function(indices) {
            this.indices = indices;
            mkdirp(path.join(indexFile, '..'));
            fs.writeFileSync(indexFile, JSON.stringify(this.indices, null, 4));
        }.bind(this));
};

Query.prototype.get = function() {
    'use strict';

    return this.initialize()
        .then(function() {
            var validVersion;

            if (this.isWorkingPackage && this.version === 'master') {
                validVersion = this.version;
            } else if (semver.validRange(this.version)) {
                var versions = Object.keys(this.indices.releases || {});

                validVersion = semver.maxSatisfying(versions, this.version);
                if (!validVersion) {
                    validVersion = 'master';
                }
            } else if (this.indices.devs[this.version]) {
                validVersion = this.version;
            } else {
                throw new Error('Bad version ' + this.url + ' ' + this.version + ' ' + semver.validRange(this.version));
            }

            if (!this.package) {
                this.package = new Package(this, validVersion);
            }

            return this.package;
        }.bind(this));
};

var query = module.exports = function(queryUrl) {
    'use strict';

    var q;

    if (!queryUrl) {
        q = new Query();
    } else if (!queryCache[queryUrl]) {
        q = queryCache[queryUrl] = new Query(queryUrl);
    }

    return q.get();
};
