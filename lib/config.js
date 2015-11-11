// jshint esnext: true

const yaml = require('js-yaml');
const fs = require('fs');

(function(module) {
  module.exports = config;

  function config() {
    return yaml.safeLoad(fs.readFileSync('pas.yml', 'utf8'));
  }
})(module);