var exec = require('child_process').exec,
    path = require('path'),
    mkdirp = require('./fsutil').mkdirp,
    fs = require('fs');

var manifest = require('../package.json');

var cached = {};

var proto = {
    version: manifest.version,
    cwd: process.cwd(),
    home: path.join(process.env.HOME, '.pas'),
    providerHome: '',
    // pluginHome: '/usr/local/lib/node_modules',
    pluginHome: '',
    debug: false,
    indexTimeout: 3600 * 24,
    // online: true,
    defaultProvider: 'github',
    providerOrder: ['local', 'github', 'packagist', 'git', 'http'],
    providers: {},
};

proto.providerHome = path.join(proto.home, 'providers');
proto.pluginHome = path.join(proto.home, 'plugins');

if (Object.setPrototypeOf) {
    Object.setPrototypeOf(cached, proto);
} else {
    cached.__proto__ = proto;
}

if (process.env.PAS_HOME) {
    cached.home = process.env.PAS_HOME;
}

if (process.env.PAS_PLUGIN_HOME) {
    cached.pluginHome = process.env.PAS_PLUGIN_HOME;
}

var configFile = path.join(cached.home, 'config.json'),
    configManifest;
try {
    configManifest = require(configFile);
    for(var i in configManifest) {
        cached[i] = configManifest[i];
    }
} catch(e) {
    configManifest = {};
}

mkdirp(cached.providerHome);
mkdirp(cached.pluginHome);

if (process.env.PAS_DEBUG === '1' || process.env.PAS_DEBUG === 'true') {
    cached.debug = true;
}
// cached.online = process.env.PAS_OFFLINE > 0 ? false : true;

var isInitialized = false;

var config = module.exports = function(key, value) {
    'use strict';

    var data = cached;

    var fields, len;

    switch (arguments.length) {
        case 0:
            return cached;
        case 1:
            fields = key.split('.');
            len = fields.length;
            fields.some(function(field, i) {
                if (data[field] === undefined || data[field] === null) {
                    data = undefined;
                    return true;
                } else {
                    data = data[field];
                }
            });
            return data;
        case 2:
            var dataManifest = configManifest;

            fields = key.split('.');
            len = fields.length;


            fields.some(function(field, i) {
                if (i + 1 !== len) {
                    if (data[field] === null || typeof data !== 'object') {
                        data[field] = {};
                    }
                    if (dataManifest[field] === null || typeof dataManifest !== 'object') {
                        dataManifest[field] = {};
                    }
                    data = data[field];
                    dataManifest = dataManifest[field];
                } else {
                    dataManifest[field] = value;
                }
            });

            fs.writeFileSync(configFile, JSON.stringify(configManifest, null, 2));

            break;
        default:
            throw new Error('Malformed config query');

    }
};

config.init = function() {
    'use strict';

    if (isInitialized) return Promise.resolve();

    isInitialized = true;

    return Promise.resolve();

    // if (cached.pluginHome) return Promise.resolve();

    // return Promise.denodeify(exec)('npm prefix -g')
    //     .then(function(prefix) {
    //         configManifest.pluginHome = proto.pluginHome = path.join(prefix.trim(), 'lib', 'node_modules');

    //         fs.writeFileSync(configFile, JSON.stringify(configManifest, null, 2));
    //     });
};