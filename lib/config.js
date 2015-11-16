// jshint esnext:true

const yaml = require('js-yaml');
const fs = require('fs-promise');
const path = require('path');
const packageJson = require('../package.json');
const _ = require('lodash');
const co = require('co');

module.exports = (function() {
  'use strict';

  var cache;
  function *config() {
    if (!cache) {
      var HOME = process.env.PAS_HOME || path.join(process.env.HOME, '.pas');
      var CONFIG = path.join(HOME, 'config.yml');

      var proto = {
        'home': HOME,
        'version': packageJson.version,
        'debug': process.env.PAS_DEBUG ? true : false,
        'json': process.env.PAS_JSON ? true : false,
        'providers.home': path.join(HOME, 'providers'),
        'providers.default': 'github',
        'providers': ['github'],
        'profiles': ['php', 'bower', 'npm'],

        'provider.github.token': null,
        'provider.github.indexCache': 60 * 60,

        save() {
          return co(function *() {
            var data = yaml.safeDump(this.dump());
            yield fs.writeFile(CONFIG, data);
          }.bind(this));
        },

        dump() {
          return _.reduce(this, function(result, value, key) {
            result[key] = value;
            return result;
          }, {});
        }
      };

      try {
        var content = yield fs.readFile(CONFIG, 'utf8');
        cache = yaml.safeLoad(content);
      } catch(e) {
        cache = {};
      }
      Object.setPrototypeOf(cache, proto);
    }

    return cache;
  }

  return config;
})();