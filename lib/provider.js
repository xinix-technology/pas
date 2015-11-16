//jshint esnext:true

const fs = require('fs-promise');
const co = require('co');
const _ = require('lodash');
const url = require('url');
const HaltError = require('./errors/halt');

module.exports = (function() {
  'use strict';

  var proto = {
    provide(source, dest) {
      return co(function *() {
        yield fs.ensureDir(dest);
        var files = yield fs.readdir(dest);
        if (files.length > 0) {
          throw new HaltError('Directory is not empty, cannot provide to specified directory ' + dest);
        }

        var meta = yield this.fetch(source);
        fs.copy(meta.cache, dest);
        return meta;
      }.bind(this));
    }
  };

  function Repository(context) {
    if (! (this instanceof Repository)) {
      return new Repository(context);
    }

    this.providers = _.reduce(context.config('providers'), function(result, name) {
      var provider = Object.create(proto);
      var adapter = require('./providers/' + name)(context);
      _.assign(provider, {name: name}, adapter);
      result[name] = provider;
      return result;
    }, {});

    this.default = context.config('providers.default');

  }

  Repository.prototype = {
    detect(source) {
      var parsed = url.parse(source);
      if (parsed.protocol) {
        throw new Error('Unimplemented yet');
      } else if (this.default) {
        return this.get(this.default);
      }
    },

    get(name) {
      return this.providers[name];
    },
  };

  return Repository;
})();