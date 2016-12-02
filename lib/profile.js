//jshint esnext:true
const fs = require('fs-promise');
const path = require('path');
const _ = require('lodash');

module.exports = (function() {
  'use strict';

  const proto = {
    *manifest(dir) {
      dir = dir || '.';
      var manifest = (yield require('./manifest')(dir)) || {};
      manifest.profile = this.name;
      return yield this.extend(manifest, dir);
    },

    extend(manifest) {
      return manifest;
    }
  };

  var unknownProfile = Object.create(proto);
  unknownProfile.name = 'unknown';

  function Repository(context) {
    if (! (this instanceof Repository)) {
      return new Repository(context);
    }

    this.profiles = _.reduce(context.config('profiles'), function(result, name) {
      var profile = Object.create(proto);
      var adapter = require('./profiles/' + name)(context);
      _.assign(profile, {name: name}, adapter);
      result[name] = profile;
      return result;
    }, {});
  }

  Repository.prototype = {
    *detect(dir) {
      dir = dir || '.';

      var data = yield require('./manifest')(dir);
      if (data && data.profile) {
        return this.get(data.profile);
      }

      return _.find(this.profiles, function(profile) {
        return profile.support(dir);
      }) || unknownProfile;
    },

    get(name) {
      return this.profiles[name];
    },
  };

  return Repository;
})();