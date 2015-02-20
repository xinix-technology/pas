var pkg = require('../pkg'),
    task = require('../task'),
    rm = require('../fsutil').rm;

var UpdateTask = function() {
    'use strict';

    this.description = 'Update dependency versions of current installation';
};

UpdateTask.prototype.exec = function(cb) {
    'use strict';

    var profiles = pkg().profiles,
        profileKeys = Object.keys(profiles);

    profileKeys.forEach(function(key) {
        rm(profiles[key].directory);
    });

    task({
        _: ['install']
    }, cb);
};

module.exports = new UpdateTask();