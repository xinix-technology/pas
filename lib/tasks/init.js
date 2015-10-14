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
  fs = require('fs');

var initTask = module.exports = function(queryUrl, baseDir) {

  'use strict';

  var fsUtil = this.require('util/fs');

  var manifestName = this.option('n') || this.option('name') || 'my/app',
    manifestVersion = this.option('v') || this.option('version') || '0.0.1',
    manifestProfile = this.option('p') || this.option('profile');

  // validate manifestName
  if (manifestName && manifestName.split('/').length !== 2) {
    manifestName = 'my/' + manifestName;
  }


  this.i('t/init', 'Initializing %s:%s:%s',
    manifestName,
    manifestVersion,
    manifestProfile || 'auto');

  baseDir = baseDir || '.';

  switch (arguments.length) {
    case 0:
      var manifestFile = path.join(this.cwd, 'pas.json');
      if (fs.existsSync(manifestFile)) {
        throw new Error('Pack already initialized, avoid reinitializing');
      }

      var manifest = {
        name: manifestName || 'my/package',
        version: manifestVersion || '0.0.1',
        profile: manifestProfile || 'unknown',
        dependencies: {}
      };
      fs.writeFileSync('./pas.json', JSON.stringify(manifest, null, 4));
      break;
    default:

      var cwd;
      var oldCwd = this.cwd;

      if (baseDir[0] === '/') {
        cwd = baseDir;
      } else {
        cwd = path.join(this.cwd, baseDir);
      }

      if (fs.existsSync(cwd) && fs.readdirSync(cwd).length > 0) {
        throw new Error('Directory is not empty, cannot proceed init');
      }

      fsUtil.mkdirp(path.dirname(cwd));

      var pack = this.query(queryUrl);
      return pack.fetch()
        .then(function(pack) {
          return fsUtil.cp(pack.cachePath, cwd, true);
        })
        .then(function() {
          if (manifestName || manifestVersion || manifestProfile) {
            try {
              var manifest = {};
              var manifestFile = path.join(pack.cachePath, 'pack.json');
              if (fs.existsSync(manifestFile)) {
                manifest = fs.readFileSync(manifestFile);
              }

              manifest.name  = manifestName || manifest.name;
              manifest.version  = manifestVersion || manifest.version;
              manifest.profile  = pack.profile.name || manifest.profile;

              fs.writeFileSync(path.join(cwd, 'pas.json'), JSON.stringify(manifest, null, 2));

              pack.working = true;
              pack.workingPath = cwd;

            } catch(e) {
              this.i('log', 'Cannot modify pas.json or no pas.json exist');
            }
          }
        }.bind(this))
        .then(function() {
          this.cwd = cwd;
          this.i('t/init', 'Installing...');
          return this.task('install').option(this.option()).run();
        }.bind(this))
        .then(function() {
          this.cwd = oldCwd;
          this.i('t/init', 'Initialized at %s', cwd);
        }.bind(this));
  }
};

initTask.description = 'Initialize new package for development';
