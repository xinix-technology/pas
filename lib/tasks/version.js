var config = require('../config')();

module.exports = {
    exec: function() {
        'use strict';

        this.report('message','%s on top of node %s', config.version, process.version);
    }
};