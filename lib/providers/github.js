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

var tmp = require('tmp'),
    rm = require('../util/fs').rm,
    mkdirp = require('../util/fs').mkdirp,
    url = require('url'),
    request = require('request'),
    tar = require('tar'),
    zlib = require('zlib'),
    path = require('path'),
    fs = require('fs'),
    semver = require('semver'),
    GitHubApi = require('github');

tmp.setGracefulCleanup();

var githubProvider = module.exports = {
    fetch: function(pack) {
        'use strict';

        var normalizedUrl = this.normalizeUrl(pack.queryUrl);

        var parsed = url.parse(normalizedUrl);
        var projectId = parsed.host + parsed.pathname;

        return this.readIndices_(pack)
            .then(function(indices) {
                return this.detectValidVersion_(pack, indices);
            }.bind(this))
            .then(function(meta) {
                pack.version = meta.version;
                pack.type = meta.type;
                pack.downloadUrl = meta.type === 'tag' ?
                    meta.index.tarball_url :
                    'https://api.github.com/repos/' + projectId + '/tarball/' + meta.version;

                return this.download_(pack, meta);
            }.bind(this));
    },

    github_: function() {
        'use strict';

        if (this.github__) {
            return this.github__;
        }

        this.github__ = new GitHubApi({
            // required
            version: '3.0.0',
            // optional
            // debug: true,
            // protocol: 'https',
            // host: 'github.my-GHE-enabled-company.com',
            // pathPrefix: '/api/v3', // for some GHEs
            // timeout: 5000,
            headers: {
                'user-agent': 'Pas-Package-Management' // GitHub is happy with a unique user agent
            }
        });

        this.github__.repos.getTags = Promise.denodeify(this.github__.repos.getTags);
        this.github__.repos.getBranches = Promise.denodeify(this.github__.repos.getBranches);

        var token = this.config('provider.github.token');
        if (token) {
            this.github__.authenticate({
                type: 'oauth',
                token: token
            });
        }

        return this.github__;
    },

    fetchTags_: function(params) {
        return this.github_().repos.getTags(params);
    },

    fetchBranches_: function(params) {
        return this.github_().repos.getBranches(params);
    },

    readIndices_: function(pack) {
        'use strict';

        var normalizedUrl = this.normalizeUrl(pack.queryUrl);

        var parsed = url.parse(normalizedUrl);
        var githubParams = {
            user: parsed.host,
            repo: parsed.pathname.substr(1)
        };
        var projectId = parsed.host + parsed.pathname;

        var indicesFile = path.join(this.indicesDirectory, projectId + '.json');

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

        return Promise.all([
                this.fetchTags_(githubParams),
                this.fetchBranches_(githubParams)
            ])
            .then(function(values) {
                return new Promise(function(resolve, reject) {
                    var tags = values[0],
                        branches = values[1];

                    var indices = {
                        tags: {},
                        branches: {},
                        meta: {
                            fetchedTime: new Date().toISOString(),
                            tags: tags.meta,
                            branches: branches.meta
                        }
                    };

                    tags.forEach(function(tag) {
                        indices.tags[tag.name] = tag;
                    });

                    branches.forEach(function(branch) {
                        indices.branches[branch.name] = branch;
                    });

                    mkdirp(path.dirname(indicesFile));
                    fs.writeFile(indicesFile, JSON.stringify(indices, null, 2), function(err) {
                        if (err) {
                            return reject(err);
                        }

                        resolve(indices);
                    });
                });
            });

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

    download_: function(pack, meta) {
        'use strict';

        var cachePath = this.getCacheFor(pack.downloadUrl);
        if (fs.existsSync(cachePath) && meta.type !== 'branch') {
            return cachePath;
        }

        var downloadUrl = pack.downloadUrl;
        var token = this.config('provider.github.token');
        if (token) {
            downloadUrl += '?access_token=' + token;
        }

        var github = this.github_(),
            githubConfigHeaders = github.config.headers;

        return Promise.denodeify(tmp.file)({ postfix: '.tar.gz' })
            .then(function(tmpPath, fd, cleanupCallback) {
                return new Promise(function(resolve, reject) {
                    var file = fs.createWriteStream(tmpPath);
                    var req = request({
                            url: downloadUrl,
                            headers: githubConfigHeaders
                        });

                    req.on('response', function(resp) {
                            if (resp.statusCode >= 200 && resp.statusCode < 300) {
                                req.pipe(file);
                            } else {
                                var chunks = [];
                                resp.on('data', function(chunk) {
                                    chunks.push(chunk);
                                });
                                resp.on('end', function(chunk) {
                                    var buff = Buffer.concat(chunks);
                                    reject(new Error(JSON.parse(buff).message));
                                });
                            }
                        })
                        .on('error', reject);

                    file.on('finish', function() {
                        rm(cachePath);

                        var fis = fs.createReadStream(tmpPath),
                            gzs = fis.pipe(zlib.createGunzip()),
                            extractor = tar.Extract({
                                path: cachePath,
                                strip: 1
                            }),
                            ts = gzs.pipe(extractor);

                        fis.on('error', reject);
                        gzs.on('error', function(err) {
                            reject(new Error('Error on gzip extract of ' + downloadUrl));
                        });
                        extractor
                            .on('error', reject)
                            .on('end', function() {
                                return resolve(cachePath);
                            });
                        ts.on('error', reject);
                    });
                });
            });
    },

    support: function(pack) {
        'use strict';

        if (pack.queryUrl.indexOf('github:') === 0 ||
            pack.queryUrl.match(/http(s)*:\/\/github.com\//)) {
            return true;
        }
    },

    normalizeUrl: function(queryUrl) {
        'use strict';

        var parsed = url.parse(queryUrl);
        switch (parsed.protocol) {
            case null:
                return 'github:' + queryUrl;
            case 'github:':
                return queryUrl;
            case 'http:':
            case 'https:':
                return 'github:' + parsed.pathname.substr(1, parsed.pathname.length - 5);
            default:
                throw new Error('Unhandled url "' + queryUrl + '" for github');
        }

    },
};