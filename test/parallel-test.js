// jshint esnext: true

const assert = require('assert');
const parallel = require('../lib/flow/parallel');

describe('parallel', function() {
  'use strict';

  it('should run asynchronously', function(done) {
    var values = [];
    parallel({
        foo: function() {
          return new Promise(function(resolve, reject) {
            setTimeout(function() {
              values.push(1);
              resolve();
            }, 1);
          });
        },
        bar: function() {
          values.push(2);
        },
      })
      .run()
      .then(function() {
        assert.deepEqual(values, [2,1]);
      })
      .then(done, done);
  });
});