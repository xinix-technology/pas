var assert = require('assert'),
  config = require('../lib/config');

describe('config', function() {
  'use strict';

  describe('config()', function() {
    it('should be instance of function', function() {
      assert(typeof config === 'function');
    });

    it('should return config', function() {
      var c = config();
      assert(typeof c === 'object');
      assert.equal(c.cwd, process.cwd());
    });
  });
});