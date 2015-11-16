//jshint esnext:true

const fs = require('fs-promise');
const path = require('path');
const _ = require('lodash');

module.exports = (function() {
  'use strict';

  function php(context) {
    return {
      support(dir) {
        try {
          if (!fs.statSync(path.join(dir, 'composer.json')).isFile()) {
            throw new Error('Not file');
          }
          return true;
        } catch(e) {
        }
      },


      extend(manifest, dir) {
        manifest.tasks = manifest.tasks || {};

        manifest.tasks.clean = _.assign({}, manifest.tasks.clean, {
          bower: {
            type: 'series',
            cmd: [
              ['rm', '-rf', 'vendor'],
              ['rm', '-rf', 'composer.lock'],
            ]
          }
        });

        manifest.tasks.install = _.assign({}, manifest.tasks.install, {
          bower: ['composer', 'install']
        });

        return manifest;
      },
    };
  }

  return php;
})();