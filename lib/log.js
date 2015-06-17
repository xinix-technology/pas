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
 * Logging
 */
var Log = module.exports = function(app, writer) {
    'use strict';

    if (!(this instanceof Log)) return new Log(app, writer);

    this.startTime = new Date().getTime();

    this.setDefaultWriter(writer);

};

Log.prototype.setDefaultWriter = function(writer) {
    'use strict';

    this.defaultOut = this.out = writer.out;
    this.defaultErr = this.err = writer.err;
};

Log.prototype.setWriter = function(writer) {
    'use strict';

    if (!writer) {
        this.out = this.defaultOut;
        this.err = this.defaultErr;
        return;
    }

    this.out = writer.out || this.defaultOut;
    this.err = writer.err || this.defaultErr;
};

/**
 * Log as info
 * @param  {string} category Log category
 * @param  {var}    message  Message as string or object
 */
Log.prototype.i = function(category, message) {
    'use strict';

    var args;
    switch (arguments.length) {
        case 0:
            args = ['out', ''];
            break;
        case 1:
            args = ['out', category];
            break;
        default:
            args = Array.prototype.slice.apply(arguments);
    }

    if (this.out) {
        this.out.apply(this, args);
    }
};

/**
 * Log as error
 * @param  {var}   err    Instance of Error or string, if value is string
 *                        expected second parameter as instance of Error.
 * @param  {Error} errObj Instance of Error (optional)
 */
Log.prototype.e = function(e, errObj) {
    'use strict';

    var message,
        error;

    if (e instanceof Error) {
        message = e.message;
        error = e;
    } else {
        message = e;
        if (errObj) {
            error = errObj;
        }
    }

    if (this.err) {
        this.err(message, error);
    }
};

Log.prototype.elapsedTime = function() {
    'use strict';

    return new Date().getTime() - this.startTime;
};