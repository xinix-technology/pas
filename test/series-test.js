// jshint esnext: true

const assert = require('assert');
const series = require('../lib/flow/series');

describe('series', function() {
  'use strict';

  it('should run in sequence', function(done) {
    var values = [];
    series({
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
        assert.deepEqual(values, [1,2]);
      })
      .then(done, done);
  });
});