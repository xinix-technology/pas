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


var printList = function(pack) {
    'use strict';

    var stringUtil = this.require('util/string');

    if (!pack.deployments) {
        this.i('Deploy to nowhere.');
        return;
    }

    this.i('Deploy'.blue);
    Object.keys(pack.deployments).forEach(function(name) {
        this.i('raw', '%s %s', stringUtil.pad(name, 10).yellow, pack.deployments[name]);
    }.bind(this));
};

var add = function(pack, name, url) {
    'use strict';

    var manifest;
    var manifestFile = path.join(pack.cachePath, 'pas.json');
    try {
        manifest = JSON.parse(fs.readFileSync(manifestFile));
    } catch(e) {
        manifest = {
            name: pack.name,
            version: pack.version,
            profile: pack.profile,
        };
    }
    manifest.deployments = manifest.deployments || {};
    manifest.deployments[name] = url;

    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
};

var deployTask = module.exports = function(name, url) {
    'use strict';

    var pack = this.query();
    return pack.fetch()
        .then(function() {
            if (this.options.l) {
                printList.call(this, pack);
            } else if (name && url) {
                add.call(this, pack, name, url);
            } else if (name) {
                return pack.deploy(name, url);
            } else {
                var promise = Promise.resolve();
                Object.keys(pack.deployments || {}).forEach(function(name) {
                    promise = promise.then(function() {
                        return pack.deploy(name, pack.deployments[name]);
                    });
                }.bind(this));

                return promise;
            }
        }.bind(this));
};

deployTask.description = 'Deploy your project to server';