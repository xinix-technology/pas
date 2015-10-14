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

var url = require('url'),
  fs = require('fs'),
  path = require('path'),
  AdmZip = require('adm-zip'),
  tmp = require('tmp'),
  tar = require('tar'),
  zlib = require('zlib'),
  request = require('request');

tmp.setGracefulCleanup();

var httpProvider = module.exports = {
  support: function(pack) {
    'use strict';

    var parsed = url.parse(pack.queryUrl);

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return true;
    }
  },

  // parse: function(queryUrl) {
  //   'use strict';

  //   throw new Error('revisit me');

  //   var parsed = url.parse(queryUrl);

  //   var name = (parsed.host || 'null') + '/' + (parsed.path || '').replace(/[:\/\\._?=&]/g, ' ').trim().replace(/\s/g, '-');
  //   var splitted = name.split('/');

  //   return {
  //     url: queryUrl,
  //     name: name,
  //     version: 'master',
  //     vendor: splitted[0],
  //     unit: splitted[1],
  //   };
  // },

  normalizeUrl: function(queryUrl) {
    'use strict';

    return queryUrl.split('#')[0] + '#master';
  },

  fetch: function(pack) {
    'use strict';

    var unzipFile = function(originFile, destination) {
      return new Promise(function(resolve, reject) {
          var zip = new AdmZip(originFile);
          zip.extractAllTo(destination, true);
          resolve(destination);
        })
        .then(function(destination) {
          return new Promise(function(resolve, reject) {
            fs.readdir(destination, function(err, files) {
              var file = path.join(destination, files[0]);
              if (files.length === 1 && fs.statSync(file).isDirectory()) {
                resolve(file);
              } else {
                resolve(destination);
              }
            });
          });
        });
    };

    var extractTarGz = function(originFile, destination) {
      return new Promise(function(resolve, reject) {
        var fis = fs.createReadStream(originFile),
          gzs = fis.pipe(zlib.createGunzip()),
          extractor = tar.Extract({
            path: destination,
            strip: 1
          }),
          ts = gzs.pipe(extractor);

        fis.on('error', reject);
        gzs.on('error', function(err) {
          reject(new Error('Error on gzip extract of ' + downloadUrl));
        });
        extractor
          .on('error', reject)
          .on('end', function() {
            return resolve(destination);
          });
        ts.on('error', reject);
      });
    };

    return new Promise(function(resolve, reject) {
      tmp.dir(function(err, dirPath, callback) {
        if (err) {
          return reject(err);
        }

        var downloadedFile = path.join(dirPath, 'output');
        var ext = path.extname(pack.queryUrl).substr(1);
        var file = fs.createWriteStream(downloadedFile);
        file.on('close', function() {
          if (ext === 'zip') {
            resolve(unzipFile(downloadedFile, path.join(dirPath, 'output-dir')));
          } else if (ext === 'gz') {
            resolve(extractTarGz(downloadedFile, path.join(dirPath, 'output-dir')));
          } else {
            reject(new Error('Unsupported file type: ' + ext));
          }
        });
        request(pack.queryUrl)
          .pipe(file);
      });
    });
    // console.log(queryUrl);
  },

  // fetchIndices: function() {
  //   'use strict';

  //   return {
  //     devs: {
  //       master: {
  //         name: 'master',
  //         type: 'dev',
  //         // url:
  //       }
  //     }
  //   };
  // },

  // pull: function() {
  //   'use strict';

  //   throw new Error('Unimplemented yet, check later');
  // }
};