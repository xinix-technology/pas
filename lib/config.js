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
    fs = require('fs'),
    mkdirp = require('../lib/util/fs').mkdirp,
    objectUtil = require('../lib/util/object');

/**
 * static values
 */
var HOME_PATH = process.env.PAS_HOME || path.join(process.env.HOME, '.pas');

/**
 * Config for pas executable
 */
var Config = module.exports = function() {
    'use strict';

    if (!(this instanceof Config)) return new Config();

    var fileConfig = JSON.parse(fs.readFileSync(path.join(this.home, 'config.json'), 'utf8'));
    objectUtil.mixin(this, fileConfig);

    if (this['providers.home']) {
        mkdirp(this['providers.home']);
    }

    if (this['plugins.home']) {
        mkdirp(this['plugins.home']);
    }
};

Config.prototype = {
    'home': HOME_PATH,
    'plugins.home': process.env.PAS_PLUGIN_HOME || path.join(HOME_PATH, 'plugins'),
    'providers.expireInterval': 60 * 60,
    'providers.home': path.join(HOME_PATH, 'providers'),
    'providers.default': 'github',
    'providers.head': ['link', 'github'],
    'providers.custom': [],
    'providers.tail': ['git', 'http', 'file'],
    'profiles.head': [],
    'profiles.custom': [],
    'profiles.tail': ['npm'],
};

Object.defineProperties(Config.prototype, {
    'sorted.providers': {
        get: function() {
            'use strict';

            var providers = [];

            if (this['providers.head']) {
                this['providers.head'].forEach(function(provider) {
                    providers.push(provider);
                });
            }

            if (this['providers.custom']) {
                this['providers.custom'].forEach(function(provider) {
                    providers.push(provider);
                });
            }

            if (this['providers.tail']) {
                this['providers.tail'].forEach(function(provider) {
                    providers.push(provider);
                });
            }

            return providers;
        }
    },

    'sorted.profiles': {
        get: function() {
            'use strict';

            var profiles = [];

            if (this['profiles.head']) {
                this['profiles.head'].forEach(function(profile) {
                    profiles.push(profile);
                });
            }

            if (this['profiles.custom']) {
                this['profiles.custom'].forEach(function(profile) {
                    profiles.push(profile);
                });
            }

            if (this['profiles.tail']) {
                this['profiles.tail'].forEach(function(profile) {
                    profiles.push(profile);
                });
            }

            return profiles;
        }
    }
});

/**
 * Utility function to merge and get all values of configuration
 * @param  {Config} conf Configuration instance
 * @return {object}      All values
 */
Config.all = function(conf) {
    'use strict';

    var all = objectUtil.copy(Object.getPrototypeOf(conf));
    objectUtil.mixin(all, conf);

    return all;
};

/**
 * Merge merged object to existing configuration
 * @param  {Config} conf   Configuration instance
 * @param  {object} merged To be merged object
 * @return {void}
 */
Config.merge = function(conf, merged) {
    'use strict';

    objectUtil.mixin(conf, merged);
};

/**
 * Persist configuration to file
 * @param  {Config} conf
 */
Config.persist = function(conf) {
    'use strict';

    fs.writeFileSync(path.join(conf.home, 'config.json'), JSON.stringify(conf, null, 2));
};

// Object.defineProperties(proto, {
//     sortProviderNames: {
//         enumerable: false,
//         writable: false,
//         value: function() {
//             'use strict';

//             if (!cachedProviderNames) {
//                 cachedProviderNames = [];

//                 (this.providers.head || []).forEach(function(providerName) {
//                     cachedProviderNames.push(providerName);
//                 });

//                 (this.providers.custom || []).forEach(function(providerName) {
//                     cachedProviderNames.push(providerName);
//                 });

//                 (this.providers.tail || []).forEach(function(providerName) {
//                     cachedProviderNames.push(providerName);
//                 });
//             }

//             return cachedProviderNames;
//         }
//     },

//     sortProfileNames: {
//         enumerable: false,
//         writable: false,
//         value: function() {
//             'use strict';

//             if (!cachedProfileNames) {
//                 cachedProfileNames = [];

//                 (this.profiles.head || []).forEach(function(profileName) {
//                     cachedProfileNames.push(profileName);
//                 });

//                 (this.profiles.custom || []).forEach(function(profileName) {
//                     cachedProfileNames.push(profileName);
//                 });

//                 (this.profiles.tail || []).forEach(function(profileName) {
//                     cachedProfileNames.push(profileName);
//                 });
//             }

//             return cachedProfileNames;
//         }
//     }
// });
