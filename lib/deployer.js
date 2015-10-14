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

var path = require('path'),
  proto = require('./proto');

var PRISTINE_DEPLOYERS = [
  './deployers/rsync.js',
];

var Deployer = module.exports = function(app, name) {
  'use strict';

  if (!(this instanceof Deployer)) return new Deployer(app, name);

  Object.defineProperties(this, {
    app: {
      enumerable: false,
      value: app
    },
  });
};

Deployer.prototype = proto();

/**
 * Fetch pack proto by query url
 * @param  {string} queryUrl Query url
 */
Deployer.prototype.fetch = function(queryUrl) {
  'use strict';

  throw new Error('Deployer ' + this.name + ' does not implement method fetch');
};

Deployer.prototype.getCacheFor = function(downloadUrl) {
  'use strict';
  return path.join(this.cacheDirectory, downloadUrl.replace(/[\/\\:#@]+/g, '/'));
};

var Repository = Deployer.Repository = function(app) {
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

  PRISTINE_DEPLOYERS.forEach(function(f) {
    var name = path.basename(f).split('.')[0];

    var proto = require(f);

    this.set(name, proto, true);
  }.bind(this));

  this.plugins.getDeployers().forEach(function(proto) {
    this.set(proto.name, proto);
  }.bind(this));
};

Repository.prototype = proto();

Repository.prototype.set = function(name, proto, core) {
  'use strict';

  var deployer = this.entries[name] = new Deployer(this.app, name);
  for(var i in proto) {
    Object.defineProperty(deployer, i, {
      value: proto[i]
    });



    if (!core) {
      var customDeployers = this.config('deployers.custom');
      if (customDeployers.indexOf(name) === -1) {
        customDeployers.push(name);
      }
    }
  }
};

Repository.prototype.get = function(name) {
  'use strict';
  return this.entries[name] || null;
};

Repository.prototype.detect = function(url) {
  'use strict';

  var resolvedDeployer;
  Object.keys(this.entries).some(function(key) {
    var deployer = this.entries[key];
    if (deployer.support(url)) {
      resolvedDeployer = deployer;
      return true;
    }
  }.bind(this));

  if (resolvedDeployer) {
    return resolvedDeployer;
  }

  // var resolved;

  // this.config('sorted.deployers').some(function(i) {
  //   if (!this.entries[i]) {
  //     throw new Error('Deployer "' + i + '" is uninitialized yet');
  //   }

  //   if (this.entries[i].support(pack)) {
  //     if (pack.working) {
  //       this.i('deployer', 'Detected %s for "%s"', i, pack);
  //     }
  //     resolved = i;
  //     return true;
  //   }
  // }.bind(this));

  // return this.entries[resolved || this.config('deployers.default')];
};