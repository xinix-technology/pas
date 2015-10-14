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
  rimraf = require('rimraf'),
  path = require('path');

/**
 * Make directory and create intermediate required directory also
 * @param  {string} dir Directory path to create
 */
var mkdirp = function(dir) {
  'use strict';

  if (!fs.existsSync(dir)) {
    var s = '/';
    dir.split(path.sep).forEach(function(p) {
      p = path.join(s, p);

      if (!fs.existsSync(p)) {
        fs.mkdirSync(p);
      }
      s = p;
    });
  }
};

/**
 * Copy file or directory from source to destination
 * @param  {string}  src
 * @param  {string}  dest
 * @param  {boolean} merge
 * @return {Promise}
 */
var cp = function(src, dest, merge) {
  'use strict';

  return new Promise(function(resolve, reject) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    // if (exists && isDirectory) {
    if (exists) {
      if (isDirectory) {
        var promises = [];

        try {
          fs.mkdirSync(dest);
        } catch(e) {
          if (!merge) {
            throw e;
          }
        }

        fs.readdirSync(src).forEach(function(childItemName) {
          promises.push(cp(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          ));
        });

        Promise.all(promises)
          .then(resolve, reject);
      } else {
        var destS = fs.createWriteStream(dest);
        fs.createReadStream(src).pipe(destS);

        destS.on('finish', function() {
          resolve();
        });

        destS.on('error', function(err) {
          reject(err);
        });
      }
    }
  });
};

/**
 * Filesystem utility helper
 * @type {Object}
 */
module.exports = {
  mkdirp: mkdirp,
  cp: cp,
  rm: rimraf.sync
};