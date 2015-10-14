var url = require('url'),
  config = require('../config')(),
  spawn = require('child_process').spawn;

var rsyncDeployer = module.exports = {

  support: function(deployUrl) {
    'use strict';

    var splitted = deployUrl.split(':');
    if (splitted[0] === 'rsync') {
      return true;
    }
  },

  deploy: function(pack, name, deployUrl) {
    'use strict';

    var parsed = url.parse(deployUrl);


    var remotePath = parsed.pathname.substr(1).replace(/[\/]+$/, '') + '/';

    var args = [
      '-e',
      'ssh -p ' + (parsed.port || 22),
      '-avz',
      this.cwd.replace(/[\/]+$/, '') + '/',
      parsed.auth + '@' + parsed.hostname + ':' + remotePath
    ];

    return new Promise(function(resolve, reject) {
      var cmd = spawn('rsync', args, {stdio: 'inherit'});
      cmd.on('close', function(code) {
        if (code === '0' || code === 0) {
          return resolve();
        }
        reject(new Error('Error with code: ' + code));
      });
    });
  }
};