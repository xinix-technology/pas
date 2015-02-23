var task = require('../task'),
    path = require('path'),
    query = require('../query'),
    config = require('../config')(),
    rm = require('../fsutil').rm;

var UpdateTask = function() {
    'use strict';

    this.description = 'Update dependency versions of current installation';
};

UpdateTask.prototype.exec = function() {
    'use strict';

    var profileManifests = query.profile.getBaseManifest().profiles;
        query.profile.getSupportedProfileNames().forEach(function(profileName) {
        rm(path.join(config.cwd, profileManifests[profileName].vendorDirectory));
    });

    return task({ _: ['install'] });
};

module.exports = new UpdateTask();