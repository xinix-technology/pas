var fs = require('fs'),
    path = require('path');

var profiles = {};

var Profile = function(profileName, reek) {
    'use strict';

    this.name = profileName;
    this.config = reek.config;
    this.options = reek.package.profiles[profileName];
};

Profile.prototype.clean = function(cb) {
    'use strict';

    var vendor = path.join(this.config.cwd, this.options.directory);
    rmdir(vendor);

    cb();
};

Profile.prototype.update = function(cb) {
    'use strict';

    this.clean(function() {
        this.install(cb);
    }.bind(this));
};

Profile.prototype.install = function(aa) {
    'use strict';

    var cb = arguments[arguments.length - 1];

    if (typeof arguments[0] === 'string') {
    }
};

module.exports = function(profileName, reek) {
    'use strict';

    if (!profiles[profileName]) {
        profiles[profileName] = new Profile(profileName, reek);
    }

    return profiles[profileName];
};