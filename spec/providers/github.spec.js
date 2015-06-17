require('../../lib/polyfills/promise');

var url = require('url');

describe('providers/github', function() {
    'use strict';

    var githubProvider;
    beforeEach(function() {
        githubProvider = require('../../lib/mocks/provider')('github');
    });

    afterEach(function() {
        githubProvider.destroy();
    });

    describe('normalizeUrl', function() {
        describe('(https url)', function() {
            it('should normalize url without hash', function() {
                var queryUrl = 'https://github.com/xinix-technology/bono.git';

                var normalizedUrl = githubProvider.normalizeUrl(queryUrl);

                var parsed = url.parse(normalizedUrl);

                expect(parsed.protocol).toEqual('github:');
                expect(parsed.hostname).toEqual('xinix-technology');
                expect(parsed.pathname).toEqual('/bono');
                expect(parsed.hash).toEqual(null);
            });
        });
    });

    if (process.env.CONFIG_GITHUB_TOKEN) {
        describe('fetchBranches_', function() {
            it('should fetch branches from github', function(done) {
                githubProvider.config = function() {
                    return process.env.CONFIG_GITHUB_TOKEN;
                };

                githubProvider.fetchBranches_({
                        user: 'xinix-technology',
                        repo: 'bono'
                    })
                    .then(function(branches) {
                        done();
                    }, function(e) {
                        done.fail(e);
                    });
            });
        });

        describe('fetchTags_', function() {
            it('should fetch tags from github', function(done) {
                githubProvider.config = function() {
                    return process.env.CONFIG_GITHUB_TOKEN;
                };

                githubProvider.fetchTags_({
                        user: 'xinix-technology',
                        repo: 'bono'
                    })
                    .then(function(tags) {
                        done();
                    }, function(e) {
                        done.fail(e);
                    });
            });
        });
    } else {
        console.log('\n  >>> Please specify CONFIG_GITHUB_TOKEN to test remote <<<\n');
    }

    describe('readIndices_', function() {
        it('should read indices of github project', function(done) {
            var pack = {
                queryUrl: 'https://github.com/xinix-technology/bono.git'
            };

            githubProvider.fetchTags_ = function() {
                var result = [
                    {
                        name: '1.0.0'
                    }
                ];

                result.meta = {};

                return Promise.resolve(result);
            };

            githubProvider.fetchBranches_ = function() {
                var result = [
                    {
                        name: 'master'
                    }
                ];

                result.meta = {};

                return Promise.resolve(result);
            };

            githubProvider.readIndices_(pack)
                .then(function(indices) {
                    expect(typeof indices.tags).toEqual('object');
                    expect(typeof indices.branches).toEqual('object');
                    expect(typeof indices.meta.tags).toEqual('object');
                    expect(typeof indices.meta.branches).toEqual('object');
                    done();
                }, function(e) {
                    done.fail(e);
                });
        }, 60000);
    });

    describe('detectValidVersion_', function() {
        var indices = {
            tags: {
                '0.1.0': {},
                '0.1.1': {},
                '1.0.0': {},
                '1.2.0': {},
                '2.0.0': {},
                '2.0.1': {},
            },
            branches: {
                'master': {},
                'staging': {}
            }
        };

        it('should detect latest release', function() {
            var pack = {
                queryUrl: 'https://github.com/xinix-technology/bono.git'
            };

            var valid = githubProvider.detectValidVersion_(pack, indices);
            expect(valid.type).toEqual('tag');
            expect(valid.version).toEqual('2.0.1');
        });

        it('should detect suitable branch', function() {
            var pack = {
                queryUrl: 'https://github.com/xinix-technology/bono.git#staging'
            };

            var valid = githubProvider.detectValidVersion_(pack, indices);
            expect(valid.type).toEqual('branch');
            expect(valid.version).toEqual('staging');
        });

        it('should throw error on non existed branch', function() {
            var pack = {
                queryUrl: 'https://github.com/xinix-technology/bono.git#notexist'
            };

            try {
                var valid = githubProvider.detectValidVersion_(pack, indices);
                throw new Error('Error not triggered');
            } catch(e) {}
        });
    });

    describe('downloads_', function() {
        it('should download file to provider\'s cache', function(done) {
            var pack = {
                queryUrl: 'https://github.com/xinix-technology/bono.git#notexist',
                downloadUrl: 'https://api.github.com/repos/xinix-technology/bono/tarball/master',
            };

            var meta = {
                type: 'branch', version: 'master', index: {}
            };

            githubProvider.config = function() {
                return process.env.CONFIG_GITHUB_TOKEN;
            };

            githubProvider.download_(pack, meta)
                .then(function(f) {
                    expect(typeof f).toEqual('string');
                    done();
                }, function(e) {
                    done.fail(e);
                });

        }, 60000);
    });
});