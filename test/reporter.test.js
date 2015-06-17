var assert = require('assert');

describe('query', function() {
    'use strict';

    var query;

    before(function(done) {
        require('../lib/config').init()
            .then(function() {
                query = require('../lib/query');
            })
            .then(done);
    });

    describe('()', function() {
        it('should be instance of function', function() {
            assert.equal(typeof query, 'function');
        });

        it('should returned promise', function() {
            assert.equal(typeof query().then, 'function');
        });
    });
});