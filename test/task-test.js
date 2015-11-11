// jshint esnext: true

const assert = require('assert');
const sinon = require('sinon');
const task = require('../lib/task');

describe('task', function() {
  'use strict';

  it('should accept function', function() {
    var spy = sinon.spy();
    var t = task(null, spy);
    t();
    assert(spy.called);
  });

  it('should accept string', function(done) {
    var spy = sinon.spy();
    var t = task(null, 'whoami');
    t(function(stream, data) {
      try {
        assert.equal(stream, 'stdout');
        assert.equal(data.message, process.env.USER);
        done();
      } catch(e) {
        done(e);
      }
    });
  });

  it('should accept array', function(done) {
    var spy = sinon.spy();
    var t = task(null, ['whoami']);
    t(function(stream, data) {
      try {
        assert.equal(stream, 'stdout');
        assert.equal(data.message, process.env.USER);
        done();
      } catch(e) {
        done(e);
      }
    });
  });
});