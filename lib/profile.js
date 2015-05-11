var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    plugin = require('./plugin'),
    manifest = require('./manifest'),
    config = require('./config')(),
    query = require('./query');

var PROFILE_INITIALIZED = false,
    PROFILES = [
        './profiles/npm.js',
    ];

var profiles = {},
    profileOrder = [];

var initialize = function() {
    'use strict';

    if (PROFILE_INITIALIZED) {
        return;
    }

    PROFILE_INITIALIZED = true;

    PROFILES.forEach(function(f) {
        var name = path.basename(f).split('.')[0];

        var proto = require(f);

        profile.set(name, proto, true);
    });

    plugin.getProfileDirectories().forEach(function(f) {
        var name = path.basename(f).split('.')[0];

        var proto = require(f);

        profile.set(name, proto);
    });
};

// var getProfileOrder = function() {
//     'use strict';

//     if (profileOrder.length === 0) {

//         if (config.profileOrder) {
//             profileOrder = config.profileOrder;
//         }

//         Object.keys(profiles).forEach(function(key) {
//             if (profileOrder.indexOf(key) < 0) {
//                 profileOrder.push(key);
//             }
//         });
//     }

//     return profileOrder;
// };

var Profile = function(name) {
    'use strict';

    Object.defineProperties(this, {
        name: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: name
        },
        vendorDirectory: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: 'vendor',
        },
        super_: {
            enumerable: false,
            writable: true,
            configurable: false,
            value: {},
        }
    });
};

Profile.prototype.require = function(name) {
    'use strict';

    return require('./' + name);
};

Profile.prototype.initialize = function() {
    'use strict';
};

Profile.prototype.readManifest = function(baseDir) {
    'use strict';

    return Promise.resolve(manifest(baseDir));

    // var i,
    //     manifest = {};

    // if (this.hasManifest(baseDir)) {
    //     var m = require(this.getManifestFile(baseDir));
    //     for(i in m) {
    //         manifest[i] = m[i];
    //     }
    // }

    // return Promise.resolve(manifest);
};

// Profile.prototype.getManifestFile = function(baseDir) {
//     'use strict';

//     return path.join(baseDir, 'pas.json');
// };

// Profile.prototype.hasManifest = function(baseDir) {
//     'use strict';
//     return fs.existsSync(this.getManifestFile(baseDir));
// };

Profile.prototype.postInstall = function(p) {
    'use strict';
};

var profile = module.exports = {};

profile.set = function(name, protoProfile, core) {
    'use strict';

    initialize();

    var profileInstance = profiles[name] = new Profile(name);

    for(var i in protoProfile) {
        profileInstance.super_[i] = profileInstance[i];
        profileInstance[i] = protoProfile[i];

        if (!core) {
            if (config.profiles.custom.indexOf(name) === -1) {
                config.profiles.custom.push(name);
            }
        }
    }

    profileInstance.initialize();
};

profile.detect = function(baseDir) {
    'use strict';

    initialize();

    var profileName = '';

    var manifestFile = path.join(baseDir, 'pas.json');

    if (fs.existsSync(manifestFile)) {
        var manifest = require(manifestFile);
        profileName = manifest.profile || '';
    }

    if (!profileName) {
        config.sortProfileNames().some(function(key) {
            if (profiles[key].support(baseDir)) {
                profileName = key;
                return true;
            }
        });
    }

    if (profileName) {
        if (!profiles[profileName]) {
            profiles[profileName] = new Profile(profileName);
        }

        return profiles[profileName];
    }

    throw new Error('No profile match for "' + baseDir + '"');
};

profile.getSupportedProfileNames = function() {
    'use strict';

    initialize();

    return Object.keys(profiles);
};
