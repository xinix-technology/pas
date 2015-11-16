//jshint esnext:true

const fs = require('fs-promise');
const path = require('path');
const _ = require('lodash');

module.exports = (function() {
  'use strict';

  function bower(context) {
    return {
      support(dir) {
        try {
          if (!fs.statSync(path.join(dir, 'bower.json')).isFile()) {
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
              ['rm', '-rf', 'bower_components'],
            ]
          }
        });

        manifest.tasks.install = _.assign({}, manifest.tasks.install, {
          bower: ['bower', 'install']
        });
        return manifest;
      },
    };
  }

  return bower;
})();