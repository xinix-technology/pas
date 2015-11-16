//jshint esnext:true

const fs = require('fs-promise');
const path = require('path');
const _ = require('lodash');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const HaltError = require('../errors/halt');

module.exports = (function() {
  'use strict';

  function npm(context) {
    return {
      support(dir) {
        try {
          if (!fs.statSync(path.join(dir, 'package.json')).isFile()) {
            throw new Error('Not file');
          }
          return true;
        } catch(e) {
        }
      },

      *extend(manifest, dir) {
        var cmdPath;
        try {
          cmdPath = yield new Promise(function(resolve, reject) {
            exec('which npm', function(err, p) {
              if (err) return reject(err);

              resolve(p.trim());
            });
          });
        } catch(e) {
          throw new HaltError('Cannot resolve NPM, Please install first');
        }

        manifest.tasks = manifest.tasks || {};

        manifest.tasks.clean = _.assign({}, manifest.tasks.clean, {
          npm: {
            type: 'series',
            cmd: [
              ['rm', '-rf', 'node_modules'],
            ]
          }
        });

        manifest.tasks.install = _.assign({}, manifest.tasks.install, {
          npm: [cmdPath, 'install'],
          // npm: function(logger) {
          //   var cmd = spawn('npm', ['install']);
          //   var errBuffer;
          //   cmd.stderr.on('data', function(data) {
          //     data = data.toString().replace('undefined', '');
          //     if (data.indexOf('npm') === 0) {
          //       if (errBuffer) {
          //         logger({level: 'error', message: errBuffer.trim()});
          //       }
          //       errBuffer = data.split('npm').slice(1).join('npm').trim();
          //     } else {
          //       errBuffer += data.trim() + ' ';
          //     }
          //   });
          //   cmd.on('exit', function() {
          //     if (errBuffer) {
          //       logger({level: 'error', message: errBuffer.trim()});
          //     }
          //   });
          // },
        });

        return manifest;
      },
    };
  }

  return npm;
})();