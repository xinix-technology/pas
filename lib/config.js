var exec = require('child_process').exec,
    path = require('path'),
    mkdirp = require('./fsutil').mkdirp,
    fs = require('fs');

var manifest = require(path.join(__dirname, '..', 'package.json'));

var cached = {
    version: manifest.version,
    cwd: process.cwd(),
    home: process.env.PAS_HOME ? process.env.PAS_HOME : path.join(process.env.HOME, '.pas'),
    providerHome: '',
    pluginHome: '',
    debug: false,
    online: true,
    defaultProvider: 'github',
    providerOrder: ['local', 'github', 'packagist', 'git', 'http'],
    providers: {},
};

var configFile = path.join(cached.home, 'config.json'),
    configManifest;
try {
    configManifest = require(configFile);
    for(var i in configManifest) {
        cached[i] = configManifest[i];
    }
} catch(e) {}

cached.providerHome = path.join(cached.home, 'providers');
mkdirp(cached.providerHome);

if (process.env.PAS_PLUGIN_HOME) {
    cached.pluginHome = process.env.PAS_PLUGIN_HOME;
}

cached.debug = process.env.PAS_DEBUG > 0 ? true : false;
cached.online = process.env.PAS_OFFLINE > 0 ? false : true;

var isInitialized = false;

var config = module.exports = function() {
    'use strict';

    return cached;
};


config.init = function() {
    'use strict';

    if (isInitialized) return Promise.resolve();

    isInitialized = true;

    if (cached.pluginHome) return Promise.resolve();

    return Promise.denodeify(exec)('npm prefix -g')
        .then(function(prefix) {
            configManifest.pluginHome = cached.pluginHome = path.join(prefix.trim(), 'lib', 'node_modules');

            fs.writeFileSync(configFile, JSON.stringify(configManifest, null, 2));
        });
};