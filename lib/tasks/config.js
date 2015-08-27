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
 * Config task
 *
 * Usage: pas config [<KEY>] [<VALUE>]
 *
 * If no argument specified will print list of full configuration
 *
 * ```
 * pas config
 * ```
 *
 * If only key specified will print specified configuration entry
 *
 * ```
 * pas config plugins.home
 * ```
 *
 * If key and value specified will update specified configuration entry with
 * specified value
 *
 * ```
 * pas config test.value value
 * ```
 *
 * If option -r specified will delete specified configuration entry
 *
 * ```
 * pas config test.value -r
 * ```
 *
 * @param  {string} key
 * @param  {string} value
 */
var configTask = module.exports = function(key, value) {
    'use strict';

    var stringUtil = this.require('util/string');

    if (this.option('r')) {
        this.config(key, null);

        this.i('t/config', 'removed');
    } else if (arguments.length >= 2) {
        try {
            var v = JSON.parse(value);
            value = v;
        } catch(e) {
        }
        this.config(key, value);
        this.i('t/config', 'saved');
    } else if (arguments.length === 1) {
        var val = this.config(key);
        var type = typeof val;
        this.i('t/config', '<%s> %s', type, JSON.stringify(val, null, 2));
    } else {
        var conf = this.config();

        this.i('Configuration:'.blue);

        for(var i in conf) {
            this.i('raw', '%s %s', stringUtil.pad(i, 25, null, '.'.grey).yellow, conf[i]);
        }
    }
};

/**
 * Config task description
 * @type {String}
 */
configTask.description = 'List, read and write configuration';