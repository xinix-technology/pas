var fs = require('fs'),
    path = require('path'),
    config = require('./config')();

var isPristinePopulated = false,
    providers = {};

var populatePristineProviders = function() {
    'use strict';

    if (isPristinePopulated) {
        return;
    }

    isPristinePopulated = true;

    fs.readdirSync(path.join(__dirname, 'providers')).forEach(function(f) {
        var name = f.split('.')[0];

        var proto = require('./providers/' + name);

        provider.set(name, proto);
    });
};

var Provider = function(name) {
    'use strict';

    Object.defineProperties(this, {
        name: {
            enumerable: true,
            writable: true,
            configurable: false,
            value: name,
        }
    });
};

var provider = module.exports = function(name) {
    'use strict';

    return providers[name || config.defaultProvider];
};

provider.set = function(name, proto) {
    'use strict';

    var providerInstance = providers[name] = new Provider(name);
    for(var i in proto) {
        providerInstance[i] = proto[i];
    }

    // if (typeof providerInstance.support !== 'function') {
    //     throw new Error('Malformed provider "' + name +'", "support" method not found or bad method');
    // }

    // if (typeof providerInstance.parse !== 'function') {
    //     throw new Error('Malformed provider "' + name +'", "parse" method not found or bad method');
    // }

    // if (typeof providerInstance.fetchIndices !== 'function') {
    //     throw new Error('Malformed provider "' + name +'", "fetchIndices" method not found or bad method');
    // }

    // if (typeof providerInstance.normalizeUrl !== 'function') {
    //     throw new Error('Malformed provider "' + name +'", "normalizeUrl" method not found or bad method');
    // }

    // if (typeof providerInstance.pull !== 'function') {
    //     throw new Error('Malformed provider "' + name +'", "pull" method not found or bad method');
    // }
};

provider.detect = function(queryUrl) {
    'use strict';

    for(var i in providers) {
        if (providers[i].support(queryUrl)) {
            return providers[i];
        }
    }

    return providers[config.defaultProvider];
};

populatePristineProviders();
