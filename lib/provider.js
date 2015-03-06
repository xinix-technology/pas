var fs = require('fs'),
    path = require('path');

var providers = {},
    providersLen = 0,
    defaultProvider;

var populateProviders = function() {
    'use strict';

    if (providersLen) return;

    fs.readdirSync(path.join(__dirname, 'providers')).forEach(function(f) {
        var name = f.split('.')[0];

        var provider = providers[name] = require('./providers/' + name);

        if (typeof provider.support !== 'function') {
            throw new Error('Malformed provider "' + name +'", "support" method not found or bad method');
        }

        if (typeof provider.parse !== 'function') {
            throw new Error('Malformed provider "' + name +'", "parse" method not found or bad method');
        }

        if (typeof provider.fetchIndices !== 'function') {
            throw new Error('Malformed provider "' + name +'", "fetchIndices" method not found or bad method');
        }

        if (typeof provider.normalizeUrl !== 'function') {
            throw new Error('Malformed provider "' + name +'", "normalizeUrl" method not found or bad method');
        }

        if (typeof provider.pull !== 'function') {
            throw new Error('Malformed provider "' + name +'", "pull" method not found or bad method');
        }

        provider.name = name;

        providersLen++;

        if (!defaultProvider) {
            defaultProvider = provider;
        }
    });
};

var provider = function(name) {
    'use strict';

    if (name) {
        return providers[name];
    } else {
        return defaultProvider;
    }
};

provider.detect = function(queryUrl) {
    'use strict';

    populateProviders();

    for(var i in providers) {
        if (providers[i].support(queryUrl)) {
            return providers[i];
        }
    }

    return defaultProvider;
};

module.exports = provider;