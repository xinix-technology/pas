var assert = require('assert'),
    path = require('path');

var pkg = require('../lib/pkg');

describe('pkg', function() {
    'use strict';

    describe('pkg()', function() {

        beforeEach(function() {
            pkg.reset();
        });

        it('should return current package', function() {
            var aPkg;

            pkg.reset();
            aPkg = pkg();
            assert.equal(aPkg.name, undefined);
        });

        it('should return valid package initialized', function() {
            var aPkg;

            pkg.reset();
            aPkg = pkg('', path.join(__dirname, 'packages/valid'));
            assert.equal(aPkg.name, 'valid/package');
            assert.equal(aPkg.initialized, true);
        });

        it('should return invalid package uninitialized', function() {
            var aPkg;

            pkg.reset();
            aPkg = pkg('', path.join(__dirname, 'packages/invalid'));
            assert.equal(aPkg.initialized, false);
        });

    });

    describe('.Package', function() {

        beforeEach(function() {
            pkg.reset();
        });

        describe('new', function() {

            it('should instantiate package object', function() {
                var aPkg = new pkg.Package('', path.join(__dirname, 'packages/valid'));
                assert.equal(aPkg.name, 'valid/package');
            });

        });
    });
});