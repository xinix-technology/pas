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
    manifestUtil = require('./util/manifest');
    proto = require('./proto');

var PRISTINE_PROFILES = [
    './profiles/npm.js',
];

var Profile = module.exports = function(app, name) {
    'use strict';

    if (!(this instanceof Profile)) return new Profile(app, name);

    Object.defineProperties(this, {
        app: {
            value: app,
            enumerable: false,
            writable: false,
            configurable: false
        },
        super_: {
            value: {},
            enumerable: false,
            writable: false,
            configurable: false
        },
        name: {
            value: name,
            enumerable: true,
            writable: false,
            configurable: false
        }
    });
};

Profile.prototype = proto();

Profile.prototype.install = function(pack) {
    'use strict';

    throw new Error('Profile ' + this.name + ' does not implement method install');
};

Profile.prototype.update = function(pack) {
    'use strict';

    throw new Error('Profile ' + this.name + ' does not implement method update');
};

Profile.prototype.read = function(pack) {
    'use strict';

    return Promise.resolve(manifestUtil(pack.cachePath, {env:this.env}));
};

Profile.prototype.up = function() {
    'use strict';

    this.i('warn', 'Profile %s does not implement up', this.name);
};

Profile.prototype.link = function(pack) {
    'use strict';

    this.i('warn', 'Profile %s does not implement link', this.name);
};


var Repository = Profile.Repository = function(app) {
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

    PRISTINE_PROFILES.forEach(function(f) {
        var name = path.basename(f).split('.')[0];

        var proto = require(f);

        this.set(name, proto, true);
    }.bind(this));

    this.plugins.getProfiles().forEach(function(proto) {
        this.set(proto.name, proto);
    }.bind(this));
};

Repository.prototype = proto();

Repository.prototype.set = function(name, proto, core) {
    'use strict';

    var profile = this.entries[name] = new Profile(this.app, name);
    for(var i in proto) {
        if (profile[i]) {
            profile.super_[i] = profile[i];
        }

        Object.defineProperty(profile, i, {
            value: proto[i]
        });

        if (!core) {
            var customProfiles = this.config('profiles.custom');
            if (customProfiles.indexOf(name) === -1) {
                customProfiles.push(name);
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

    try {
        resolved = require(path.join(pack.cachePath, 'pas.json')).profile;
    } catch(e) {}

    if (!resolved) {
        this.config('sorted.profiles').some(function(i) {
            if (!this.entries[i]) {
                throw new Error('Profile "' + i + '" is uninitialized yet');
            }

            if (this.entries[i].support(pack)) {
                if (pack.working) {
                    this.i('profile', 'Detected %s for "%s"', i, pack);
                }
                resolved = i;
                return true;
            }
        }.bind(this));
    }

    if (!resolved) {
        throw new Error('No profile match for "' + pack + '"');
    }

    return this.entries[resolved];
};