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

var proto = require('./proto'),
    fsUtil = require('./util/fs'),
    fs = require('fs'),
    semver = require('semver'),
    spawn = require('child_process').spawn,
    path = require('path'),
    stringUtil = require('./util/string');

var INSTALL_CACHE = {};

var Pack = module.exports = function(app, queryUrl) {
    'use strict';

    var provider, profile;
    Object.defineProperties(this, {
        app: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: app
        },
        provider: {
            enumerable: false,
            configurable: false,
            get: function() {
                if (!provider) {
                    provider = this.providers.detect(this);
                }
                if (!provider) {
                    throw new Error('Cannot found suitable provider for ' + this.queryUrl);
                }
                return provider;
            }.bind(this)
        },
        profile: {
            enumerable: false,
            configurable: false,
            get: function() {
                if (!profile) {
                    profile = this.profiles.detect(this);
                }
                if (!profile) {
                    throw new Error('Cannot found suitable profile for ' + this.queryUrl);
                }
                return profile;
            }.bind(this),
            set: function(profileName) {
                profileName = profileName.name || profileName;

                if (profile.name !== profileName) {
                    profile = this.profiles.get(profileName);
                }
            }
        }
    });

    this.working = false;
    this.queryUrl = queryUrl;
    this.cachePath = null;
};

Pack.prototype = proto();

Pack.prototype.fetch = function() {
    'use strict';

    try {
        // if (this.debug) {
        //     this.i('d/pack', 'Fetching %s', this.queryUrl);
        // }
        return Promise.resolve(this.provider.fetch(this))
            .then(function(cachePath) {
                if (!cachePath) {
                    throw new Error('Provider method ' + this.provider.name + '#fetch does not return cache path!');
                }

                this.cachePath = cachePath;

                return this.profile.read(this);
            }.bind(this))
            .then(function(manifest) {
                if (!manifest) {
                    throw new Error('Profile method ' + this.profile.name + '#read does not return manifest, or invalid profile manifest!');
                }

                for(var i in manifest) {
                    this[i] = manifest[i];
                }

                return this;
            }.bind(this));
    } catch(e) {
        return Promise.reject(e);
    }
};

Pack.prototype.synchronizeInstall = function() {
    'use strict';

    return new Promise(function(resolve, reject) {

    }.bind(this));
};

Pack.prototype.install = function() {
    'use strict';

    var avoidInstall = true;
    if (INSTALL_CACHE[this.name]) {
        var older = INSTALL_CACHE[this.name].pack;

        if (this.version !== older.version) {
            if (semver.valid(older.version)) {
                if (semver.valid(this.version)) {
                    if (semver.gt(this.version, older.version)) {
                        avoidInstall = false;
                    }
                } else {
                    avoidInstall = false;
                }
            } else if (!semver.valid(this.version)) {
                throw new Error(this.name + ' conflicted version ' + this.version + ' vs ' + older.version);
            }
        }

        if (avoidInstall) {
            this.i('pack', 'Avoid to reinstall ' + this.name + ' ' + older.version + ' -> ' + this.version);
            return Promise.resolve();
        } else {
            this.i('pack', 'Attempt to reinstall ' + this.name + ' ' + older.version + ' -> ' + this.version);
        }
    }

    INSTALL_CACHE[this.name] = {
        pack: this,
        startTime: new Date()
    };

    try {
        this.i('pack', 'Installing from %s', this.queryUrl);
        return Promise.resolve(this.profile.install(this))
            .then(function() {
                // installing module
                var promise = Promise.resolve();

                (this.modules || []).forEach(function(modulePath) {
                    promise = promise.then(function() {

                        return new Promise(function(resolve, reject) {

                            var cwd;
                            if (modulePath[0] === '/') {
                                cwd = modulePath;
                            } else {
                                cwd = path.join(this.cwd, modulePath);
                            }

                            this.i('pack', 'Installing from module %s', cwd);
                            var pas = spawn(process.argv[0], [process.argv[1], 'install'], {
                                stdio: 'inherit',
                                cwd: cwd,
                            });

                            pas.on('close', function(errCode) {
                                if (errCode) {
                                    reject(new Error('CLI Error: ' + errCode));
                                } else {
                                    resolve();
                                }
                            });
                        }.bind(this));
                    }.bind(this));
                }.bind(this));

                return promise;
            }.bind(this))
            .then(function() {
                var deltaTime = new Date() - INSTALL_CACHE[this.name].startTime;
                this.i('pack', 'Installed %s in %0.3fs', this.name, deltaTime / 1000);

                return this;
            }.bind(this));
    } catch(e) {
        return Promise.reject(e);
    }
};

Pack.prototype.update = function() {
    'use strict';

    try {
        this.i('pack', 'Updating %s', this.queryUrl);
        return Promise.resolve(this.profile.update(this))
            .then(function() {
                return this;
            });
    } catch(e) {
        return Promise.reject(e);
    }
};

Pack.prototype.uninstall = function() {
    'use strict';

    try {
        this.i('pack', 'Uninstall %s', this.queryUrl);
        return Promise.resolve(this.profile.uninstall(this))
            .then(function() {
                return this;
            });
    } catch(e) {
        return Promise.reject(e);
    }
};

Pack.prototype.up = function(options) {
    'use strict';

    return Promise.resolve(this.profile.up(this, options));
};

Pack.prototype.link = function() {
    'use strict';

    var cachePath;

    if (this.working) {
        var origPath = this.cachePath;
        cachePath = path.join(this.provider.cacheDirectory, 'link', this.name, 'master');

        fsUtil.mkdirp(path.dirname(cachePath));
        if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
        }
        fs.symlinkSync(origPath, cachePath);

        return this;
    } else {
        return this.profile.link(this);
    }

};

Pack.prototype.toString = function() {
    'use strict';

    return this.queryUrl;
};

var Repository = Pack.Repository = function(app) {
    'use strict';

    if (!(this instanceof Repository)) return new Repository(app);

    Object.defineProperty(this, 'app', {
        enumerable: false,
        writable: false,
        configurable: false,
        value: app
    });
};

Repository.prototype = proto();

Repository.prototype.query = function(queryUrl) {
    'use strict';

    return new Pack(this.app, queryUrl || 'file:');
};
