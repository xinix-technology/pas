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

        if (config.providers && config.providers.github && config.providers.github.token) {
            github_.authenticate({
                type: 'oauth',
                token: config.providers.github.token
            });
        }

        return github_;
    };

tmp.setGracefulCleanup();

var GithubProvider = function() {
    'use strict';
};

GithubProvider.prototype.fetchIndices = function(vendor, unit) {
    'use strict';

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
};

GithubProvider.prototype.pull = function(fromPath, toPath) {
    'use strict';

    return Promise.denodeify(tmp.file)({ postfix: '.tar.gz' })
        .then(function(tmpPath, fd, cleanupCallback) {
            return new Promise(function(resolve, reject) {
                var file = fs.createWriteStream(tmpPath);
                var suffix = '';
                if (config && config.providers && config.providers.github && config.providers.github.token) {
                    suffix = '?access_token=' + config.providers.github.token;
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
                    gzs.on('error', reject);
                    extractor
                        .on('error', reject)
                        .on('end', resolve);
                    ts.on('error', reject);
                });
            });
        });
};

GithubProvider.prototype.support = function(queryUrl) {
    'use strict';

    if (queryUrl.indexOf('github:') === 0) {
        return true;
    }
};

GithubProvider.prototype.parse = function(queryUrl) {
    'use strict';

    var normalizedUrl = this.normalizeUrl(queryUrl);

    var parsed = url.parse(normalizedUrl);

    return {
        url: normalizedUrl,
        name: parsed.hostname + parsed.pathname,
        version: parsed.hash ? parsed.hash.substr(1) : '',
        vendor: parsed.hostname,
        unit: parsed.pathname.substr(1),
    };
};

GithubProvider.prototype.normalizeUrl = function(queryUrl) {
    'use strict';

    if (this.support(queryUrl)) {
        return queryUrl;
    }

    return 'github:' + queryUrl;
};

module.exports = new GithubProvider();