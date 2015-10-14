/**
 * Copyright (c) 2015 Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var fs = require('fs'),
  path = require('path'),
  proto = require('./proto');

var Plugin = module.exports = function(app, name, proto) {
  'use strict';

  if (!(this instanceof Plugin)) return new Plugin(name, proto);

  Object.defineProperties(this, {
    app: {
      value: app
    },
    name: {
      value: name,
      enumerable: true,
      writable: false,
      configurable: false,
    },
    description: {
      value: '',
      enumerable: true,
      writable: true,
    },
    version: {
      value: '0.0.0',
      enumerable: true,
      writable: true,
    },
    providers: {
      value: [],
      enumerable: false,
      writable: true,
    },
    profiles: {
      value: [],
      enumerable: false,
      writable: true,
    },
    deployers: {
      value: [],
      enumerable: false,
      writable: true,
    },
    super_: {
      value: {},
      enumerable: false,
      writable: false,
      configurable: false
    }
  });

  for(var i in proto) {
    if (this[i]) {
      this.super_[i] = this[i];
    }
    Object.defineProperty(this, i, {
      enumerable: false,
      value: proto[i]
    });
  }

  if (typeof proto === 'function') {
    this.super_.initialize = this.initialize;
    Object.defineProperty(this, 'initialize', {
      enumerable: false,
      value: proto
    });
  }

  var manifest = require(path.join(this.baseDirectory, 'package.json'));
  this.description = manifest.description;
  this.version = manifest.version;

  if (!Array.isArray(this.providers)) {
    var providerBaseDir = path.join(this.baseDirectory, 'providers');
    if (fs.existsSync(providerBaseDir)) {
      fs.readdirSync(providerBaseDir).forEach(function(f) {
        this.providers.push(path.join(providerBaseDir, f));
      }.bind(this));
    }
  }

  if (!Array.isArray(this.profiles)) {
    var profileBaseDir = path.join(this.baseDirectory, 'profiles');
    if (fs.existsSync(profileBaseDir)) {
      fs.readdirSync(profileBaseDir).forEach(function(f) {
        this.profiles.push(path.join(profileBaseDir, f));
      }.bind(this));
    }
  }

  if (!Array.isArray(this.deployers)) {
    var deployerBaseDir = path.join(this.baseDirectory, 'deployers');
    if (fs.existsSync(deployerBaseDir)) {
      fs.readdirSync(deployerBaseDir).forEach(function(f) {
        this.deployers.push(path.join(deployerBaseDir, f));
      }.bind(this));
    }
  }

  this.initialize.apply(this, arguments);
};

Plugin.prototype = proto();

Plugin.prototype.initialize = function() {
  'use strict';

  // noop
};

var Repository = Plugin.Repository = function(app) {
  'use strict';

  if (!(this instanceof Repository)) return new Repository(app);

  Object.defineProperties(this, {
    app: {
      enumerable: false,
      writable: false,
      configurable: false,
      value: app
    },
    entries: {
      enumerable: false,
      writable: true,
      configurable: true,
      value: {}
    }
  });

  var searchDirs = [
    {
      visibility: 'global',
      directory: app.config('plugins.home'),
    },
    {
      visibility: 'local',
      directory: './node_modules'
    }
  ];

  searchDirs.forEach(function(search) {
    if (!fs.existsSync(search.directory)) {
      return;
    }

    fs.readdirSync(search.directory).forEach(function(file) {
      if (file.indexOf('pas-') === 0) {
        try {
          var fullPath = path.join(search.directory, file);
          var proto = require(fullPath);

          proto.visibility = search.visibility;
          proto.baseDirectory = fullPath;

          this.set(file, proto);
        } catch(e) {
          console.error(e.stack);
        }
      }
    }.bind(this));
  }.bind(this));
};

Repository.prototype.set = function(name, proto) {
  'use strict';

  this.entries[name] = new Plugin(this.app, name, proto);
};

Repository.prototype.getProviders = function() {
  'use strict';

  var result = [];

  Object.keys(this.entries).forEach(function(i) {
    var plugin = this.entries[i];
    plugin.providers.forEach(function(file) {
      var name = path.basename(file).split('.')[0];

      var proto = require(file);
      proto.name = name;
      proto.plugin = plugin;

      result.push(proto);
    });
  }.bind(this));

  return result;
};

Repository.prototype.getProfiles = function() {
  'use strict';

  var result = [];

  Object.keys(this.entries).forEach(function(i) {
    var plugin = this.entries[i];
    plugin.profiles.forEach(function(file) {
      var name = path.basename(file).split('.')[0];

      var proto = require(file);
      proto.name = name;
      proto.plugin = plugin;

      result.push(proto);
    });
  }.bind(this));

  return result;
};

Repository.prototype.getDeployers = function() {
  'use strict';

  var result = [];

  Object.keys(this.entries).forEach(function(i) {
    this.entries[i].deployers.forEach(function(dir) {
      throw new Error('Unimplemented');
      result.push(dir);
    });
  }.bind(this));

  return result;
};