var config = require('../config')();

var versionTask = module.exports = {

    exec: function() {
        'use strict';

        this.i('raw', '%s on top of node %s', this.app.version, process.version);
    }
};

versionTask.description = 'Print version';