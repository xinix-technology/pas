var tmp = require('tmp'),
    url = require('url'),
    request = require('request'),
    tar = require('tar'),
    zlib = require('zlib'),
    fs = require('fs'),
    config = require('../config')(),
    GitHubApi = require('github'),
    github_,
    getGithub = function() {
        'use strict';

        if (github_) {
            return github_;
        }

        github_ = new GitHubApi({
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

        if (config.provider && config.provider.github && config.provider.github.token) {
            github_.authenticate({
                type: 'oauth',
                token: config.provider.github.token
            });
        }

        return github_;
    };

tmp.setGracefulCleanup();

var githubProvider = module.exports = {

    fetchIndices: function(queryUrl) {
        'use strict';

        var parsed = this.parse(queryUrl),
            vendor = parsed.vendor,
            unit = parsed.unit;

        var fetchTags_ = Promise.denodeify(getGithub().repos.getTags),
            fetchBranches_ = Promise.denodeify(getGithub().repos.getBranches),
            githubParameters = {
                user: vendor,
                repo: unit
            };

        return Promise.all([ fetchTags_(githubParameters), fetchBranches_(githubParameters) ])
            .then(function(values) {
                var tags = values[0],
                    branches = values[1];

                var indices = {
                    releases: {},
                    devs: {}
                };

                tags.forEach(function(tag) {
                    indices.releases[tag.name] = {
                        name: tag.name,
                        // contentType: 'application/x-gzip',
                        url: 'https://api.github.com/repos/' + vendor + '/' + unit + '/tarball/' + tag.name,
                        type: 'release'
                    };
                });

                branches.forEach(function(branch) {
                    indices.devs[branch.name] = {
                        name: branch.name,
                        // contentType: 'application/x-gzip',
                        url: 'https://api.github.com/repos/' + vendor + '/' + unit + '/tarball/' + branch.name,
                        type: 'dev'
                    };
                });


                return indices;
            });
    },

    pull: function(from, toPath) {
        'use strict';

        var fromPath = from.url;

        return Promise.denodeify(tmp.file)({ postfix: '.tar.gz' })
            .then(function(tmpPath, fd, cleanupCallback) {
                return new Promise(function(resolve, reject) {
                    var file = fs.createWriteStream(tmpPath);
                    var suffix = '';
                    if (config && config.provider && config.provider.github && config.provider.github.token) {
                        suffix = '?access_token=' + config.provider.github.token;
                    }
                    var req = request({
                            url: fromPath + suffix,
                            headers: getGithub().config.headers
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
                        var fis = fs.createReadStream(tmpPath),
                            gzs = fis.pipe(zlib.createGunzip()),
                            extractor = tar.Extract({
                                path: toPath,
                                strip: 1
                            }),
                            ts = gzs.pipe(extractor);

                        fis.on('error', reject);
                        gzs.on('error', function(err) {
                            reject(new Error('Error on gzip extract of ' + fromPath));
                        });
                        extractor
                            .on('error', reject)
                            .on('end', resolve);
                        ts.on('error', reject);
                    });
                });
            });
    },

    support: function(queryUrl) {
        'use strict';

        if (queryUrl.indexOf('github:') === 0 ||
            queryUrl.match(/http(s)*:\/\/github.com\//)) {
            return true;
        }
    },

    normalizeUrl: function(queryUrl) {
        'use strict';

        if (this.support(queryUrl)) {
            return queryUrl;
        }

        return 'github:' + queryUrl;
    },
};