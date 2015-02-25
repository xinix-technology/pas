var fs = require('fs'),
    path = require('path'),
    config = require('./config')(),
    query = require('./query');

var CONF_FILENAME = 'pas.json';

var protoProfiles = {};

var Profile = function(name, p) {
    'use strict';

    var proto;

    Object.defineProperties(this, {
        super_: {
            enumerable: false,
            writable: true,
            configurable: false,
            value: {},
        },
        package: {
            enumerable: false,
            writable: true,
            configurable: false,
            value: p
        }
    });

    this.name = name;
    this.manifest = null;

    try {
        proto = protoProfiles[name];
    } catch(e) {
        throw new Error('Profile not found');
    }

    if (typeof proto === 'function') {
        this.super_.initialize = this.initialize;
        this.initialize = proto;
    } else {
        for(var i in proto) {
            this.super_[i] = this[i];
            this[i] = proto[i];
        }
    }

    this.readManifest();

    this.initialize();
};

Profile.prototype.initialize = function() {
    'use strict';
};

Profile.prototype.readManifest = function() {
    'use strict';

    if (this.manifest) {
        return this.manifest;
    }

    var i,
        manifest = {},
        baseManifest = profile.getBaseManifest().profiles[this.name];

    if (baseManifest) {
        for(i in baseManifest) {
            this[i] = baseManifest[i];
        }
    }

    if (this.hasManifest()) {
        var m = require(this.getManifestFile());
        for(i in m) {
            manifest[i] = m[i];
        }
    }

    this.manifest = manifest;

    return manifest;
};

Profile.prototype.getManifestFile = function() {
    'use strict';

    return path.join(this.package.baseDir, CONF_FILENAME);
};

Profile.prototype.hasManifest = function() {
    'use strict';
    return fs.existsSync(this.getManifestFile());
};

Profile.prototype.postInstall = function(p) {
    'use strict';
};

var profile = {};

profile.detect = function(p) {
    'use strict';

    var profileName = '';

    var manifestFile = path.join(p.baseDir, CONF_FILENAME);

    if (fs.existsSync(manifestFile)) {
        var manifest = require(manifestFile);
        profileName = manifest.profile || '';
    }

    if (!profileName) {
        Object.keys(protoProfiles).forEach(function(key) {
            if (profileName) return;
            if (protoProfiles[key].support(p.baseDir)) {
                profileName = key;
            }
        });
    }

    if (profileName) {
        return new Profile(profileName, p);
    }

    throw new Error('Profile not found for "' + p.name + '"');
};

profile.getBaseManifest = function() {
    'use strict';

    return require(path.join(__dirname, '..', CONF_FILENAME));
};

profile.getSupportedProfileNames = function() {
    'use strict';

    return Object.keys(protoProfiles);
};

Object.keys(profile.getBaseManifest().profiles).forEach(function(baseProfileName) {
    try {
        protoProfiles[baseProfileName] = require(path.join(__dirname, 'profiles', baseProfileName));
    } catch(e) {

    }
});

module.exports = profile;