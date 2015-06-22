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

var url = require('url'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('../util/fs').mkdirp,
    cp = require('../util/fs').cp,
    rm = require('../util/fs').rm,
    spawn = require('child_process').spawn,
    semver = require('semver');

var gitProvider = module.exports = {
    runGit_: function(args, options) {
        'use strict';

        return new Promise(function(resolve, reject) {
            if (this.debug) {
                this.i('d/git', '$! git %s', args.join(' '));
            }

            var git = spawn('git', args, options || {});
            var buffers = [],
                errors = [];

            git.stdout.on('data', function(data) {
                // if (this.debug) {
                //     console.log('O', data.toString());
                // }
                buffers.push(data);
            }.bind(this));

            git.stderr.on('data', function(data) {
                // if (this.debug) {
                //     console.error('E', data.toString());
                // }
                errors.push(data);
            }.bind(this));

            git.on('close', function(code) {
                if (code) {
                    reject(new Error(Buffer.concat(errors).toString()));
                } else {
                    resolve(Buffer.concat(buffers));
                }
            });
        }.bind(this));

    },

    getIndicesFor: function(downloadUrl) {
        'use strict';

        return path.join(this.indicesDirectory, downloadUrl.replace(/[\/\\:#@]+/g, '/') + '.json');
    },

    support: function(pack) {
        'use strict';

        var parsed = url.parse(pack.queryUrl);

        if (parsed.pathname && parsed.pathname.substr(-4) === '.git') {
            return true;
        }
    },

    readIndices_: function(pack) {
        'use strict';

        var splitted = pack.queryUrl.split('#');
        var normalizedUrl = this.normalizeUrl(splitted[0]);

        var indicesFile = this.getIndicesFor(normalizedUrl);

        try {
            var lastIndices = JSON.parse(fs.readFileSync(indicesFile));
            var lastFetchedTime = new Date(lastIndices.meta.fetchedTime);
            var delta = (new Date().getTime() - lastFetchedTime.getTime()) / 1000;
            if (delta < this.config('providers.expireInterval')) {
                return Promise.resolve(lastIndices);
            }
        } catch(e) {
            // console.error(e.stack);
        }

        return this.runGit_(['ls-remote', '--tags', '--heads', normalizedUrl])
            .then(function(result) {
                var indices = {
                    tags: {},
                    branches: {},
                    meta: {
                        fetchedTime: new Date().toISOString()
                    },
                };
                result.toString().split('\n').forEach(function(line) {
                    if (!line || line.substr(-3) === '^{}') return null;
                    var splitted = line.split(/\s+/);
                    var segments = splitted[1].split('/');
                    var type = segments[1] === 'heads' ? 'branch' : 'tag';

                    if (type === 'tag') {
                        indices.tags[segments[2]] = {
                            'type': type,
                            'version': segments[2],
                            'commit': splitted[0]
                        };
                    } else {
                        indices.branches[segments[2]] = {
                            'type': type,
                            'version': segments[2],
                            'commit': splitted[0]
                        };
                    }
                });

                mkdirp(path.dirname(indicesFile));
                fs.writeFileSync(indicesFile, JSON.stringify(indices, null, 2));

                return indices;
            }.bind(this));
    },

    detectValidVersion_: function(pack, indices) {
        'use strict';

        var parsed = url.parse(pack.queryUrl);
        var queryVersion = parsed.hash ? parsed.hash.substr(1) : '*';

        if (semver.validRange(queryVersion)) {
            var tags = Object.keys(indices.tags);

            // console.log('gi', pack.queryUrl, queryVersion);
            var satisfiedVersion = semver.maxSatisfying(tags, queryVersion);

            if (satisfiedVersion) {
                return {
                    type: 'tag',
                    version: satisfiedVersion,
                    index: indices.tags[satisfiedVersion]
                };
            } else if (queryVersion === '*' && indices.branches.master) {
                return {
                    type: 'branch',
                    version: 'master',
                    index: indices.branches.master
                };
            }
        } else {
            var branch = indices.branches[queryVersion];
            if (branch) {
                return {
                    type: 'branch',
                    version: queryVersion,
                    index: indices.branches[queryVersion]
                };
            } else {
                return {
                    type: 'commit',
                    version: queryVersion
                };
            }
        }

        throw new Error('Invalid version or version not found ' + queryVersion);
    },

    fetch: function(pack) {
        'use strict';

        var splitted = pack.queryUrl.split('#');
        var normalizedUrl = this.normalizeUrl(splitted[0]);
        var version = splitted[1] || '*';

        return this.readIndices_(pack)
            .then(function(indices) {
                return this.detectValidVersion_(pack, indices);
            }.bind(this))
            .then(function(meta) {
                pack.version = meta.version;
                pack.type = meta.type;
                pack.downloadUrl = normalizedUrl;

                return this.download_(pack, meta);
            }.bind(this));
    },

    download_: function(pack, meta) {
        'use strict';

        var cachePath = path.join(this.getCacheFor(pack.downloadUrl), meta.version);

        if (fs.existsSync(cachePath)) {
            if (meta.type === 'branch') {
                try {
                    var lastModified = new Date(fs.statSync(cachePath).mtime);
                    var delta = (new Date().getTime() - lastModified.getTime()) / 1000;
                    if (delta < this.config('providers.expireInterval')) {
                        return cachePath;
                    }
                } catch(e) {
                }
            } else {
                return cachePath;
            }
        }

        mkdirp(path.dirname(cachePath));

        if (meta.type === 'branch') {
            rm(cachePath);
        }

        return this.runGit_(['clone', '--branch', meta.version, '--depth', '1', pack.downloadUrl, cachePath])
            .then(function() {
                rm(path.join(cachePath, '.git'));
                return cachePath;
            });
    },

    // parse: function(queryUrl) {
    //     'use strict';

    //     var splitted = queryUrl.split('#');
    //     var hashSplitted = splitted[1].split('@');
    //     var name = hashSplitted[0];
    //     var version = hashSplitted[1];
    //     var nameSplitted = name.split('/');
    //     var gitUrl = splitted[0];

    //     var result = {
    //         url: this.normalizeUrl(queryUrl),
    //         name: name,
    //         version: version,
    //         vendor: nameSplitted[0],
    //         unit: nameSplitted[1],
    //         gitUrl: gitUrl
    //     };

    //     return result;
    // },

    // fetchIndices: function(queryUrl) {
    //     'use strict';

    //     var parsed = this.parse(queryUrl);

    //     return Promise.denodeify(exec)('git ls-remote --tags --heads "' + parsed.gitUrl + '"')
    //         .then(function(refs) {
    //             var indices = {
    //                 releases: {},
    //                 devs: {}
    //             };

    //             refs.trim().split('\n').forEach(function(line) {
    //                 if (line.substr(-3) === '^{}') {
    //                     return;
    //                 }

    //                 var matches = line.match(/^([^\s]+)\s+refs\/([^\/]+)\/(.+)$/);

    //                 if (matches[2] === 'heads') {
    //                     indices.devs[matches[3]] = {
    //                         name: matches[3],
    //                         url: queryUrl + '#' + matches[3],
    //                         type: 'dev',
    //                     };
    //                 } else {
    //                     indices.releases[matches[3]] = {
    //                         name: matches[3],
    //                         url: queryUrl + '#' + matches[3],
    //                         type: 'release',
    //                     };
    //                 }
    //             });

    //             return indices;
    //         });
    // },

    normalizeUrl: function(queryUrl) {
        'use strict';

        var parsed = url.parse(queryUrl);
        if (parsed.protocol) {
            return queryUrl;
        } else if (queryUrl[0] === '/') {
            return 'file://' + queryUrl;
        } else {
            return 'ssh://' + queryUrl.replace(':', '/');
        }
    },

    // pull: function(from, toPath) {
    //     'use strict';

    //     var parsed = this.parse(from.url);

    //     return this.runScope(parsed.gitUrl, function(scope) {
    //         return execPromise('cd "' + scope.directory + '" && git checkout ' + parsed.version)
    //             .then(function() {
    //                 rm(toPath);
    //                 return cp(scope.directory, toPath);
    //             })
    //             .then(function() {
    //                 // remove .git on usage
    //                 rm(path.join(toPath, '.git'));
    //             });
    //     });
    // },

    // runScope: function(repoUrl, fn) {
    //     'use strict';

    //     if (typeof fn !== 'function') {
    //         throw new Error('Run scope should define function to run');
    //     }

    //     var normalizedUrl = this.normalizeUrl(repoUrl);

    //     var promise;
    //     if (!scopes[normalizedUrl]) {
    //         var repoName = '-/' + normalizedUrl.replace(/[:\\\/@.]/g,'-');
    //         var repoDir = this.getDirectory(repoName);

    //         if (!fs.existsSync(repoDir)) {
    //             mkdirp(path.join(repoDir, '..'));
    //             promise = execPromise('git clone --depth 1 ' + normalizedUrl + ' "' + repoDir + '"')
    //                 .then(function() {
    //                     var scope = scopes[normalizedUrl] = {
    //                         url: normalizedUrl,
    //                         name: repoName,
    //                         directory: repoDir,
    //                         promise: promise
    //                     };

    //                     return fn(scope);
    //                 });
    //             return promise;
    //         } else {
    //             promise = execPromise('cd "' + repoDir + '" && git fetch')
    //                 .then(function() {
    //                     var scope = scopes[normalizedUrl] = {
    //                         url: normalizedUrl,
    //                         name: repoName,
    //                         directory: repoDir,
    //                         promise: promise
    //                     };

    //                     return fn(scope);
    //                 });
    //             return promise;
    //         }
    //     } else {
    //         var scope = scopes[normalizedUrl];
    //         scope.promise = scope.promise.then(function() {
    //             return fn(scope);
    //         });
    //         return scope.promise;
    //     }
    // },
};