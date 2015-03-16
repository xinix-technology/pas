var fs = require('fs'),
    path = require('path'),
    config = require('./config')();

var PLUGIN_INITIALIZED = false;

var plugins = {};

var initialize = function() {
    'use strict';

    if (PLUGIN_INITIALIZED) return;

    PLUGIN_INITIALIZED = true;

    var searchs = [
        [config.pluginHome, 'global'],
        ['./node_modules', 'local']
    ];

    searchs.forEach(function(search) {
        var dir = search[0];
        var visibility = search[1];

        if (!fs.existsSync(dir)) return;

        fs.readdirSync(dir).forEach(function(f) {
            if (f.indexOf('pas-') === 0) {
                try {
                    var p = path.join(dir, f);
                    var proto = require(p);

                    proto.visibility = visibility;
                    proto.baseDirectory = p;

                    plugin.set(f, proto);
                } catch(e) {
                    // console.log(e.stack);
                }
            }
        });
    });
};

var Plugin = function(name, proto) {
    'use strict';

    this.name = name;

    for(var i in proto) {
        this[i] = proto[i];
    }

    if (typeof proto === 'function') {
        this.initialize = proto;
    }

    var manifest = require(path.join(this.baseDirectory, 'package.json'));

    this.description = manifest.description;
    this.version = manifest.version;

    if (!Array.isArray(this.providerDirectories)) {
        this.providerDirectories = [];

        var providerBaseDir = path.join(this.baseDirectory, 'providers');
        if (fs.existsSync(providerBaseDir)) {
            fs.readdirSync(providerBaseDir).forEach(function(f) {
                this.providerDirectories.push(path.join(providerBaseDir, f));
            }.bind(this));
        }
    }

    if (!Array.isArray(this.profileDirectories)) {
        this.profileDirectories = [];

        var profileBaseDir = path.join(this.baseDirectory, 'profiles');
        if (fs.existsSync(profileBaseDir)) {
            fs.readdirSync(profileBaseDir).forEach(function(f) {
                this.profileDirectories.push(path.join(profileBaseDir, f));
            }.bind(this));
        }
    }
};

var plugin = module.exports = function() {
    'use strict';
};

plugin.search = function() {
    'use strict';

    initialize();

    return plugins;
};


plugin.set = function(name, proto) {
    'use strict';

    var i;

    initialize();

    plugins[name] = new Plugin(name, proto);
};

plugin.getProviderDirectories = function() {
    'use strict';

    initialize();

    var result = [];

    Object.keys(plugins).forEach(function(i) {
        plugins[i].providerDirectories.forEach(function(dir) {
            result.push(dir);
        });
    });

    return result;
};

plugin.getProfileDirectories = function() {
    'use strict';

    initialize();

    var result = [];

    Object.keys(plugins).forEach(function(i) {
        plugins[i].profileDirectories.forEach(function(dir) {
            result.push(dir);
        });
    });

    return result;
};