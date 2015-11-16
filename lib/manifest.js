// jshint esnext: true

const yaml = require('js-yaml');
const fs = require('fs-promise');
const path = require('path');

module.exports = (function(module) {
  'use strict';

  function *manifest(dir) {
    try {
      var content = yield fs.readFile(path.join(dir, 'pas.yml'), 'utf8');
      return yaml.safeLoad(content);
    } catch(e) {
    }
  }

  return manifest;
})(module);