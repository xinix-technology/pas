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
 * Log the start time
 * @type {Date}
 */

/**
 * String utility helper
 */
var string = module.exports = {
    /**
     * Insert padding to string
     * @param  {string} str     Original string
     * @param  {number} padding padding amount
     * @param  {string} align   Alignment, left or right
     * @param  {string} ch      Char to pad
     * @return {string}         Padded string
     */
    pad: function(str, padding, align, ch) {
        'use strict';

        padding = padding || 0;
        align = align || 'left';
        ch = ch || ' ';

        str = str.substr(0, padding);
        var rest = padding - str.length;
        if (rest > 0) {
            for(var i = 0; i < rest; i++) {
                if (align === 'right') {
                    str = ch + str;
                } else if (align === 'left') {
                    str = str + ch;
                }
            }
        }

        return str;
    }
};
