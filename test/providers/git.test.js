var assert = require('assert'),
    git = require('../../lib/providers/git');

describe('providers/git', function() {
    'use strict';

    describe('#normalizeUrl', function() {

        it('should handle short git url', function() {
            var normalized;

            normalized = git.normalizeUrl('git@github.com:xinix-technology/pas.git');
            assert.equal(normalized, 'ssh://git@github.com:xinix-technology/pas.git');

            normalized = git.normalizeUrl('git@github.com:anu.git');
            assert.equal(normalized, 'ssh://git@github.com:anu.git');
        });

        it('should handle short file url', function() {
            var normalized;

            normalized = git.normalizeUrl('/home/reekoheek/my/repo/.git');
            assert.equal(normalized, 'file:///home/reekoheek/my/repo/.git');

        });

        it('should handle ssh url', function() {
            var normalized;

            normalized = git.normalizeUrl('ssh://git@xinix.co.id/my/repo.git');
            assert.equal(normalized, 'ssh://git@xinix.co.id/my/repo.git');

            normalized = git.normalizeUrl('ssh://git@xinix.co.id:2200/repo.git');
            assert.equal(normalized, 'ssh://git@xinix.co.id:2200/repo.git');

        });


    });
});