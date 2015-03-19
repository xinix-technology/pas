var path = require('path');

var deployers = {};

var DEPLOY_INITIALIZED = false,
    DEPLOYERS = [
        './deployers/rsync.js',
    ];

var initialize = function() {
    'use strict';

    if (DEPLOY_INITIALIZED) return;

    DEPLOY_INITIALIZED = true;

    DEPLOYERS.forEach(function(f) {
        var name = path.basename(f).split('.')[0];

        var proto = require(f);

        deploy.set(name, proto);
    });
};

var Deployer = function(name) {
    'use strict';

    this.name = name;
};

Deployer.prototype.support = function() {
    'use strict';
    throw new Error('Unsupported deployer ' + this.name + ' (no support method)');
};

Deployer.prototype.deploy = function() {
    'use strict';
    throw new Error('Unsupported deployer ' + this.name + ' (no deploy method)');
};

var deploy = module.exports = function(name) {
    'use strict';

    initialize();

    return deployers[name || config.defaultProvider];
};

deploy.set = function(name, proto) {
    'use strict';

    initialize();

    var deployerInstance = deployers[name] = new Deployer(name);
    for(var i in proto) {
        deployerInstance[i] = proto[i];
    }
};

deploy.detect = function(deployUrl) {
    'use strict';

    initialize();

    var deployerName;

    Object.keys(deployers).some(function(key) {
        if (deployers[key].support(deployUrl)) {
            deployerName = key;
            return true;
        }
    });

    if (!deployerName) {
        throw new Error('Unsupported deployer for url: ' + deployUrl);
    }

    return deployers[deployerName];
};
