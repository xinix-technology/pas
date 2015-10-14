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

var Provider = require('../provider'),
  path = require('path'),
  fsUtil = require('../util/fs');

module.exports = function(name) {
  'use strict';

  var proto = require('../providers/' + name);

  var tmpDir = path.resolve('./tmp');
  var provider = {
    cacheDirectory: path.join(tmpDir, 'cache'),
    indicesDirectory: path.join(tmpDir, 'indices'),
  };

  fsUtil.mkdirp(provider.cacheDirectory);
  fsUtil.mkdirp(provider.indicesDirectory);

  Object.setPrototypeOf(provider, Provider.prototype);

  for(var i in proto) {
    provider[i] = proto[i];
  }

  provider.config = function() {
    var mock = {
      'mock': true
    };

    if (arguments.length === 0) {
      return mock;
    }
  };

  provider.destroy = function() {
    fsUtil.rm(tmpDir);
  };

  return provider;
};