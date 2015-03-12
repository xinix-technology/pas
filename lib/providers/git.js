var url = require('url'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('../fsutil').mkdirp,
    cp = require('../fsutil').cp,
    rm = require('../fsutil').rm,
    exec = require('child_process').exec,
    execPromise = Promise.denodeify(exec);

var scopes = {};

var gitProvider = module.exports = {
    support: function(queryUrl) {
        'use strict';

        var parsed = url.parse(queryUrl);

        if (parsed.pathname.substr(-4) === '.git') {
            return true;
        }
    },

    parse: function(queryUrl) {
        'use strict';

        var splitted = queryUrl.split('#');
        var hashSplitted = splitted[1].split('@');
        var name = hashSplitted[0];
        var version = hashSplitted[1];
        var nameSplitted = name.split('/');
        var gitUrl = splitted[0];

        var result = {
            url: this.normalizeUrl(queryUrl),
            name: name,
            version: version,
            vendor: nameSplitted[0],
            unit: nameSplitted[1],
            gitUrl: gitUrl
        };

        return result;
    },

    fetchIndices: function(queryUrl) {
        'use strict';

        var parsed = this.parse(queryUrl);

        return Promise.denodeify(exec)('git ls-remote --tags --heads "' + parsed.gitUrl + '"')
            .then(function(refs) {
                var indices = {
                    releases: {},
                    devs: {}
                };

                refs.trim().split('\n').forEach(function(line) {
                    if (line.substr(-3) === '^{}') {
                        return;
                    }

                    var matches = line.match(/^([^\s]+)\s+refs\/([^\/]+)\/(.+)$/);

                    if (matches[2] === 'heads') {
                        indices.devs[matches[3]] = {
                            name: matches[3],
                            url: queryUrl + '#' + matches[3],
                            type: 'dev',
                        };
                    } else {
                        indices.releases[matches[3]] = {
                            name: matches[3],
                            url: queryUrl + '#' + matches[3],
                            type: 'release',
                        };
                    }
                });

                return indices;
            });
    },

    normalizeUrl: function(queryUrl) {
        'use strict';

        var parsed = url.parse(queryUrl);
        if (parsed.protocol) {
            return queryUrl;
        } else {
            if (queryUrl[0] === '/') {
                return 'file://' + queryUrl;
            } else {
                return 'ssh://' + queryUrl;
            }
        }
    },

    pull: function(from, toPath) {
        'use strict';

        var parsed = this.parse(from.url);

        return this.runScope(parsed.gitUrl, function(scope) {
            return execPromise('cd "' + scope.directory + '" && git checkout ' + parsed.version)
                .then(function() {
                    rm(toPath);
                    return cp(scope.directory, toPath);
                });
        });
    },

    runScope: function(repoUrl, fn) {
        'use strict';

        if (typeof fn !== 'function') {
            throw new Error('Run scope should define function to run');
        }

        var normalizedUrl = this.normalizeUrl(repoUrl);
        // console.log('r', repoUrl, '\nn', normalizedUrl);

        var promise;
        if (!scopes[normalizedUrl]) {
            var repoName = '-/' + normalizedUrl.replace(/[:\\\/@.]/g,'-');
            var repoDir = this.getDirectory(repoName);

            if (!fs.existsSync(repoDir)) {
                mkdirp(path.join(repoDir, '..'));
                promise = execPromise('git clone --depth 1 ' + normalizedUrl + ' "' + repoDir + '"')
                    .then(function() {
                        var scope = scopes[normalizedUrl] = {
                            url: normalizedUrl,
                            name: repoName,
                            directory: repoDir,
                            promise: promise
                        };

                        return fn(scope);
                    });
                return promise;
            } else {
                promise = execPromise('cd "' + repoDir + '" && git fetch')
                    .then(function() {
                        var scope = scopes[normalizedUrl] = {
                            url: normalizedUrl,
                            name: repoName,
                            directory: repoDir,
                            promise: promise
                        };

                        return fn(scope);
                    });
                return promise;
            }
        } else {
            var scope = scopes[normalizedUrl];
            scope.promise = scope.promise.then(function() {
                return fn(scope);
            });
            return scope.promise;
        }
    },
};