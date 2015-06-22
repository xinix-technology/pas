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

var PRISTINE_PROVIDERS = [
    './providers/git.js',
    './providers/github.js',
    './providers/http.js',
    './providers/file.js',
    './providers/link.js',
];

var Provider = module.exports = function(app, name) {
    'use strict';

    if (!(this instanceof Provider)) return new Provider(app, name);

    var home = app.config('providers.home');
    Object.defineProperties(this, {
        app: {
            enumerable: false,
            value: app
        },
        name: {
            enumerable: true,
            value: name
        },
        cacheDirectory: {
            value: path.join(home, 'cache')
        },
        indicesDirectory: {
            value: path.join(home, 'indices', name)
        }
    });
};

Provider.prototype = proto();

/**
 * Fetch pack proto by query url
 * @param  {string} queryUrl Query url
 */
Provider.prototype.fetch = function(queryUrl) {
    'use strict';

    throw new Error('Provider ' + this.name + ' does not implement method fetch');
};

Provider.prototype.getCacheFor = function(downloadUrl) {
    'use strict';
    return path.join(this.cacheDirectory, downloadUrl.replace(/[\/\\:#@]+/g, '/'));
};

var Repository = Provider.Repository = function(app) {
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

    PRISTINE_PROVIDERS.forEach(function(f) {
        var name = path.basename(f).split('.')[0];

        var proto = require(f);

        this.set(name, proto, true);
    }.bind(this));

    this.plugins.getProviders().forEach(function(proto) {
        this.set(proto.name, proto);
    }.bind(this));
};

Repository.prototype = proto();

Repository.prototype.set = function(name, proto, core) {
    'use strict';

    var provider = this.entries[name] = new Provider(this.app, name);
    for(var i in proto) {
        Object.defineProperty(provider, i, {
            value: proto[i]
        });



        if (!core) {
            var customProviders = this.config('providers.custom');
            if (customProviders.indexOf(name) === -1) {
                customProviders.push(name);
            }
        }
    }
};

Repository.prototype.get = function(name) {
    'use strict';
    return this.entries[name] || null;
};

Repository.prototype.detect = function(pack) {
    'use strict';

    var resolved;

    this.config('sorted.providers').some(function(i) {
        if (!this.entries[i]) {
            throw new Error('Provider "' + i + '" is uninitialized yet');
        }

        if (this.entries[i].support(pack)) {
            if (pack.working) {
                this.i('provider', 'Detected %s for "%s"', i, pack);
            }
            resolved = i;
            return true;
        }
    }.bind(this));

    return this.entries[resolved || this.config('providers.default')];
};

// Provider.prototype.getIndices = function(packageName, queryUrl) {
//     'use strict';

//     var indexFile = this.getIndexFile(packageName);

//     return new Promise(function(resolve, reject) {
//             fs.exists(indexFile, function(exists) {
//                 if (exists) {
//                     var oldIndices = require(indexFile);
//                     if (oldIndices && oldIndices.meta && oldIndices.meta.expiredAt && (new Date(oldIndices.meta.expiredAt)).getTime() > (new Date()).getTime()) {
//                         return resolve(oldIndices);
//                     }
//                 }

//                 this.i('provider', 'Fetching new indices of "' + queryUrl + '"');

//                 var promise = Promise.resolve(this.fetchIndices(queryUrl))
//                     .then(function(indices) {
//                         if (!indices) return;

//                         mkdirp(path.join(indexFile, '..'));

//                         var date = new Date();

//                         indices.meta = {
//                             expiredAt: new Date(date.getTime() + (1000 * config.timeout))
//                         };

//                         fs.writeFileSync(indexFile, JSON.stringify(indices, null, 2));

//                         return indices;
//                     }.bind(this));

//                 resolve(promise);
//             }.bind(this));
//         }.bind(this));
// };

// Provider.prototype.require = function(name) {
//     'use strict';

//     return require('./' + name);
// };

// Provider.prototype.parse = function(queryUrl) {
//     'use strict';

//     var normalizedUrl = this.normalizeUrl(queryUrl);

//     var parsed = url.parse(normalizedUrl);

//     var result = {
//         url: normalizedUrl,
//         name: parsed.hostname + (parsed.pathname || ''),
//         version: parsed.hash ? decodeURIComponent(parsed.hash.substr(1)).split(/[\s@]+/)[0] : '',
//         vendor: parsed.hostname,
//         unit: parsed.pathname ? parsed.pathname.substr(1) : '',
//     };

//     return result;
// };

// Provider.prototype.getBaseDirectory = function(packageName) {
//     'use strict';

//     return path.join(config.providers.home, this.name, packageName);
// };

// Provider.prototype.getDirectory = function(packageName, version) {
//     'use strict';

//     return path.join(this.getBaseDirectory(packageName), version || 'master');
// };

// Provider.prototype.getIndexFile = function(packageName) {
//     'use strict';

//     return path.join(this.getBaseDirectory(packageName), 'indices.json');
// };

// Provider.prototype.support = function() {
//     'use strict';

//     throw new Error('Unimplemented support method of provider: ' + this.name);
// };

// Provider.prototype.pull = function() {
//     'use strict';

//     throw new Error('Unimplemented pull method of provider: ' + this.name);
// };

// Provider.prototype.fetchIndices = function() {
//     'use strict';

//     throw new Error('Unimplemented fetchIndices method of provider: ' + this.name);
// };

// Provider.prototype.normalizeUrl = function() {
//     'use strict';

//     throw new Error('Unimplemented normalizeUrl method of provider: ' + this.name);
// };

// var provider = module.exports = function(name) {
//     'use strict';

//     initialize();

//     return providers[name || config.providers.default];
// };