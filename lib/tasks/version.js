var config = require('../config')();

var versionTask = module.exports = {

  exec: function() {
    'use strict';

    var stringUtil = this.require('util/string');

    this.i('Versions:');

    this.i('raw', '%s %s', stringUtil.pad('pas', 18, null, '.'.grey), this.app.version);
    this.i('raw', '%s %s', stringUtil.pad('node', 18, null, '.'.grey), process.version);
  }
};

versionTask.description = 'Print version';