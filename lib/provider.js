var fs = require('fs'),
    path = require('path');

var providers = {},
    defaultProvider;

fs.readdirSync(path.join(__dirname, 'providers')).forEach(function(f) {
    var name = f.split('.')[0];
    providers[name] = require('./providers/' + name);
    providers[name].name = name;
    if (!defaultProvider) {
        defaultProvider = providers[name];
    }
});

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

    for(var i in providers) {
        if (providers[i].support(queryUrl)) {
            return providers[i];
        }
    }

    return defaultProvider;
};

module.exports = provider;