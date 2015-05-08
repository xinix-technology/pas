var config = require('../config')();

module.exports = {
    exec: function() {
        'use strict';

        this.report('message','pas    : %s', config.version);
        this.report('message','node   : %s', process.version);
    }
};