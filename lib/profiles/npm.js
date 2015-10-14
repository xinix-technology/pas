var fs = require('fs'),
  path = require('path'),
  spawn = require('child_process').spawn;

var npmProfile = module.exports = {
  support: function(pack) {
    'use strict';

    if (fs.existsSync(path.join(pack.cachePath, 'package.json'))) {
      return true;
    }
  },

  install: function(pack) {
    'use strict';

    return new Promise(function(resolve, reject) {

      var npmInstall = spawn('npm', ['install'], {stdio: 'inherit'});
      npmInstall.on('error', reject);
      npmInstall.on('close', resolve);
    }.bind(this));
  }
};
