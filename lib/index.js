var config = require('./config')(),
    fs = require('fs'),
    path = require('path'),
    semver = require('semver'),
    mkdirp = require('./fsutil').mkdirp,
    rm = require('./fsutil').rm,
    cp = require('./fsutil').cp,
    config = require('./config')();

var indexCache = {};

var Index = function(name) {
    'use strict';

    this.name = name;
    this.provider = require('./providers/github');
    this.indices = {
        releases: {},
        devs: {}
    };
};

Index.prototype.satisfy = function(version) {
    'use strict';

    if (semver.validRange(version)) {
        var versions = Object.keys(this.indices.releases);
        var validVersion = semver.maxSatisfying(versions, version);
        if (!validVersion) {
            validVersion = 'master';
        }
        return validVersion;
    } else if (this.indices.devs[version]) {
        return version;
    } else {
        throw new Error('Bad version ' + this.name + '#' + version);
    }

};

Index.prototype.pull = function(version, cb) {
    'use strict';

    var from, to;
    try {
        var satisfied = this.satisfy(version);
        if (semver.validRange(satisfied)) {
            if (satisfied === 'master') {
                from = this.indices.devs[satisfied].url;
            } else {
                from = this.indices.releases[satisfied].url;
            }

            to = path.join(config.repository, this.name, satisfied);

            if (fs.existsSync(to)) {
                return cb(null, satisfied);
            }
        } else {
            from = this.indices.devs[satisfied].url;
            to = path.join(config.repository, this.name, satisfied);

            // FIXME mechanism to cache and purge cache
            if (fs.existsSync(to)) {
                return cb(null, satisfied);
            }
            // rm(to);
        }

        this.provider.pull(from, to, function(err) {
            if (err) {
                cb(err);
            }

            cb(err, satisfied);
        });
    } catch(err) {
        return cb(err);
    }

};

Index.prototype.archetypePull = function(version, to, cb) {
    this.pull(version, function(err, version) {
        if (err) {
            return cb(err);
        }
        rm(config.cwd);
        cp(
            path.join(config.repository, this.name, version),
            config.cwd
        );
        cb(null, version);
    }.bind(this));
};

Index.prototype.fetch = function(cb) {
    'use strict';

    var indexFile = path.join(config.indices, this.name, 'indices.json');

    if (fs.existsSync(indexFile)) {
        this.indices = require(indexFile).entries;
        cb(null, this.indices);
    } else {
        this.provider.fetchIndices(this.name, function(err, indices) {
            if (err) {
                return cb(err);
            }

            mkdirp(path.join(indexFile, '..'));
            fs.writeFileSync(indexFile, JSON.stringify({
                    entries: indices,
                    lastModified: new Date()
                }, null, 2));

            this.indices = indices;
            cb(null, indices);
        }.bind(this));
    }
};

var index = function(url, cb) {
    'use strict';

    if (!indexCache[url]) {
        indexCache[url] = new Index(url);
        indexCache[url].fetch(function(err) {
            if (err) {
                return cb(err);
            }
            cb(null, indexCache[url]);
        });
    } else {
        cb(null, indexCache[url]);
    }
};

module.exports = index;