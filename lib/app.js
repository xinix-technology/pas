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

/**
 * requires
 */
require('./polyfills/promise');

var Config = require('../lib/config'),
    Task = require('../lib/task'),
    Plugin = require('../lib/plugin'),
    Provider = require('../lib/provider'),
    Profile = require('../lib/profile'),
    Pack = require('../lib/pack'),
    Log = require('../lib/log'),
    objectUtil = require('../lib/util/object'),
    stringUtil = require('../lib/util/string'),
    sprintf = require('sprintf-js').sprintf,
    packageJson = require('../package.json'),
    util = require('util'),
    delegates = require('delegates'),
    events = require('events');

/**
 * Application constructor
 * @return {Application}
 */
var App = module.exports = function(name, id) {
    'use strict';

    if (!(this instanceof App)) return new App(name, id);

    events.EventEmitter.call(this);

    var that = this;

    Object.defineProperties(this, {
        log: {
            value: new Log(this, {
                out: function(category) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (category !== 'raw') {
                        args[0] = stringUtil.pad(category.toUpperCase(), 8) + ' ' + args[0];
                    }

                    if (that.debug) {
                        args[0] = sprintf('%07.3f %s', this.elapsedTime() / 1000, args[0]);
                    }
                    console.log(sprintf.apply(null, args));
                },
                err: function(message, err) {
                    if (that.debug) {
                        if (err && err.stack) {
                            console.error(sprintf('%07.3f %s %s\n%s', this.elapsedTime() / 1000, stringUtil.pad('ERROR', 8), message, err.stack));
                        } else {
                            console.error(sprintf('%07.3f %s %s', this.elapsedTime() / 1000, stringUtil.pad('ERROR', 8), message));
                        }
                    } else {
                        console.error(sprintf('%s %s', stringUtil.pad('ERROR', 8), message));
                    }
                }
            })
        }
    });

    // set default values
    this.version = packageJson.version;
    this.env = process.env.PAS_ENV || 'development';
    this.cwd = process.cwd();
    this.debug = (process.env.PAS_DEBUG == '1' ||
        process.env.PAS_DEBUG == 'true' ||
        process.env.PAS_DEBUG == 'yes') ? true : false;

    this.name = name || '';
    this.id = id || '';
    this.args = [];
    this.options = {};

    var configs, packs, plugins, providers, profiles;

    Object.defineProperties(this, {
        configs: {
            get: function() {
                if (!configs) {
                    configs = new Config();
                }
                return configs;
            }.bind(this)
        },
        packs: {
            get: function() {
                if (!packs) {
                    packs = new Pack.Repository(this);
                }
                return packs;
            }.bind(this)
        },
        plugins: {
            get: function() {
                if (!plugins) {
                    plugins = new Plugin.Repository(this);
                }
                return plugins;
            }.bind(this)
        },
        providers: {
            get: function() {
                if (!providers) {
                    providers = new Provider.Repository(this);
                }
                return providers;
            }.bind(this)
        },
        profiles: {
            get: function() {
                if (!profiles) {
                    profiles = new Profile.Repository(this);
                }
                return profiles;
            }.bind(this)
        }
    });
};

util.inherits(App, events.EventEmitter);

/**
 * Get and set application configuration
 *
 * If no argument specified will returns object that contains full
 * configuration.
 *
 * If only key specified will returns value of specified configuration key. But
 * if the first arguments is object, the object will be merged to configuration.
 *
 * If key and value specified will set configuration by specified key and value,
 * but if the value is null then will delete specified key.
 *
 * @param  {mixed}  key   Key to get and set configuration
 * @param  {var}    value Value to set configuration by key specified
 * @return {var}
 */
App.prototype.config = function(key, value) {
    'use strict';

    if (typeof key === 'object') {
        Config.merge(this.configs, key);
        return this;
    }

    switch (arguments.length) {
        case 0:
            return Config.all(this.configs);
        case 1:
            return this.configs[key] || null;
        default:
            if (value === null) {
                delete this.configs[key];
            } else {
                this.configs[key] = value;
            }

            Config.persist(this.configs);

            return this;
    }
};

/**
 * Get and set application options (usually extracted from command line)
 * @param  {mixed} key
 * @param  {mixed} value
 * @return {mixed}
 */
App.prototype.option = function(key, value) {
    'use strict';

    if (typeof key === 'object') {
        objectUtil.mixin(this.options, key);
        return this;
    }

    switch (arguments.length) {
        case 0:
            return this.options;
        case 1:
            return this.options[key] || null;
        default:
            if (value === null) {
                delete this.options[key];
            } else {
                this.options[key] = value;
            }
            return this;
    }
};

/**
 * Get and set application arguments (usually extracted from command line)
 * @param  {array} args
 * @return {mixed}
 */
App.prototype.arg = function(args) {
    'use strict';

    if (arguments.length === 0) {
        return this.args;
    } else {
        this.args = args;
        return this;
    }
};

/**
 * Run application
 * @return {void}
 */
App.prototype.run = function() {
    'use strict';

    return new Promise(function(resolve, reject) {
            return this.generateTask_()
                .run()
                .then(this.onDone.bind(this), this.onError.bind(this));
        }.bind(this))
        .then(null, function(err) {
            this.onError(err);
        }.bind(this));
};

App.prototype.generateTask_ = function() {
    'use strict';

    if (this.id) {
        return this.task(this.id);
    } else {
        if (Object.keys(this.options).length === 0) {
            this.options.h = true;
        }

        if (this.options.h) {
            return this.task('help');
        } else if (this.options.v) {
            return this.task('version');
        }
    }
};

App.prototype.task = function(id) {
    'use strict';

    return new Task(this, id)
        .arg(this.args)
        .option(this.options);
};

App.prototype.onDone = function() {
    'use strict';

    this.emit('exit');

    if (this.debug) {
        var memUsage = process.memoryUsage();
        this.i('raw', '');
        this.i('raw', 'Memory Usage');
        this.i('raw', '  rss        %10.3f mb', memUsage.rss / 1024 / 1024);
        this.i('raw', '  heap total %10.3f mb', memUsage.heapTotal / 1024 / 1024);
        this.i('raw', '  heap used  %10.3f mb', memUsage.heapUsed / 1024 / 1024);
    }
};

App.prototype.onError = function(err) {
    'use strict';

    try {
        this.e(err.message, err);
    } catch(e) {
        console.error('UNCAUGHT ERROR', e.stack);
    }

    this.emit('error', err);
};

/**
 * Delegate require to app in order to get internal pas module
 * @param  {string} name Module name to require
 * @return {object}      Module required
 */
App.prototype.require = function(name) {
    'use strict';

    return require('./' + name);
};

delegates(App.prototype, 'packs')
    .method('query');

delegates(App.prototype, 'log')
    .method('e')
    .method('i');
