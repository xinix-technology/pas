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

var exec = require('child_process').exec,
  spawn = require('child_process').spawn,
  semver = require('semver');

var upgradeTask = module.exports = function(pluginName) {
  'use strict';

  var stringUtil = this.require('util/string');

  var i;
  var versions = [
    {
    name: 'pas',
    version: this.app.version
    }
  ];

  var plugins = this.plugins.entries;
  if (pluginName && !plugins[pluginName])
    throw Error('Plugin ' + pluginName + ' not found!');
  if (plugins[pluginName]) {
    versions.push({
    name: pluginName,
    version: plugins[pluginName].version,
    });
  } else {
    for(i in plugins) {
    versions.push({
      name: i,
      version: plugins[i].version,
    });
    }
  }

  var promises = [];
  versions.forEach(function(pack) {
    promises.push(new Promise(function(resolve, reject) {
    var cmd = 'npm view ' + pack.name + ' version';
    exec(cmd, function(err, result) {
      if (err) {
      return reject(err);
      }

      pack.newVersion = result.trim();
      if (pack.newVersion === pack.version) {
      pack.status = 'N';
      pack.formattedStatus = 'N'.grey;
      } else if (semver.gt(pack.newVersion, pack.version)) {
      pack.status = 'U';
      pack.formattedStatus = 'U'.green;
      } else {
      pack.status = 'D';
      pack.formattedStatus = 'D'.red;
      }
      resolve(pack);
    });
    }));
  });

  this.i('Checking statuses...');

  return Promise.all(promises)
    .then(function(packs) {
    var upgradables = [];
    packs.forEach(function(pack) {
      this.i('raw', '%s %s %s -> %s',
      pack.formattedStatus,
      stringUtil.pad(pack.name, 20, null, '.'.grey),
      stringUtil.pad(pack.version, 10, 'right', '.'.grey),
      stringUtil.pad(pack.newVersion, 10));

      if (pack.status === 'U') {
      upgradables.push(pack);
      }
    }.bind(this));
    return upgradables;
    }.bind(this))
    .then(function(packs) {
    if (packs.length === 0) return packs;

    return new Promise(function(resolve, reject) {
      process.stdout.write('Continue to upgrade? [Y/n] ');
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', function (text) {
      text = text.trim();
      if (text === '' || text.toLowerCase() === 'y') {
        resolve(packs);
      } else {
        reject(new Error('Upgrade aborted'));
      }
      process.stdin.pause();
      });
    }.bind(this));
    }.bind(this))
    .then(function(packs) {
    if (packs.length === 0) {
      this.i('Nothing to upgrade');
      return packs;
    }

    this.i('Upgrading...');
    var promise = Promise.resolve();
    packs.forEach(function(pack) {
      if (pack.status !== 'U') {
      return;
      }

      promise = promise.then(function() {
      return new Promise(function(resolve, reject) {
        this.i('raw', 'Reinstalling %s %s -> %s ...', pack.name, pack.version, pack.newVersion);

        var install = spawn('npm', ['install', '-g', pack.name], {stdio: 'inherit'});
        install.on('exit', function() {
        resolve();
        });
      }.bind(this));
      }.bind(this));
    }.bind(this));

    return promise;
    }.bind(this));
};

upgradeTask.description = 'Upgrade pas installation';