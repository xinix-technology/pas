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
 * Object utility helper
 * @type {object}
 */
var object = module.exports = {

  /**
   * Deep copy of object
   * @param  {object} from Original object
   * @return {object}    Copied object
   */
  copy: function(from) {
    'use strict';

    if (typeof from !== 'object' || Array.isArray(from)) {
      return from;
    }

    var result = {};
    for(var key in from) {
      if (typeof from[key] === 'object' && !Array.isArray(from[key])) {
        result[key] = object.copy(from[key]);
      } else {
        result[key] = from[key];
      }
    }

    return result;
  },

  /**
   * Mixin objects to destination object
   * @param  {object} destination
   * @param  {object} origin
   * @return {object}
   */
  mixin: function(destination, origin) {
    'use strict';

    var i;

    for(i in origin) {
      destination[i] = object.copy(origin[i]);
    }

    var newArgs = Array.prototype.slice.call(arguments, 2);
    if (newArgs.length > 0) {
      newArgs.unshift(destination);
      destination = object.mixin.apply(object, newArgs);
    }

    return destination;
  }
};