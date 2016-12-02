// jshint esnext: true

const yaml = require('js-yaml');
const fs = require('fs-promise');
const path = require('path');

module.exports = (function(module) {
  'use strict';

  function *manifest(dir) {
    try {
      var content = '';
      try {
        content = yield fs.readFile(path.join(dir, 'pas.yml'), 'utf8');
      } catch(e) {}
      return yaml.safeLoad(content);
    } catch(e) {
      console.error('* Invalid parse yml: ' + e.message);
    }
  }

  return manifest;
})(module);