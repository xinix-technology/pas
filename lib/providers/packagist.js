var url = require('url'),
    tmp = require('tmp'),
    Promise = require('promise'),
    fs = require('fs'),
    semver = require('semver'),
    request = require('request'),
    tar = require('tar'),
    zlib = require('zlib'),
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
                'user-agent': 'Reek-Package-Management' // GitHub is happy with a unique user agent
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

var packagistProvider = {
    support: function(packageUrl) {
        'use strict';

        if (packageUrl.indexOf('https://packagist.org/p/') === 0) {
            return true;
        }
    },

    parse: function(packageUrl) {
        'use strict';

        var parsed = url.parse(packageUrl),
            name = parsed.pathname.match(/^\/p\/(.+)$/)[1],
            splitted = name.split('/');

        var version = parsed.hash ? decodeURIComponent(parsed.hash.substr(1)) : '';
        var c = {
            url: packageUrl,
            name: name,
            version: version,
            vendor: splitted[0],
            unit: splitted[1],
        };
        return c;
    },

    fetchIndices: function(vendor, unit) {
        'use strict';

        var packageName = vendor + '/' + unit;
        var packageUrl = 'https://packagist.org/p/' + packageName + '.json';

        var indices = {
            releases: {},
            devs: {}
        };
        var reqOptions = {
            url: packageUrl,
            json: true
        };

        return new Promise(function(resolve, reject) {
            request(reqOptions, function(err, resp, body) {
                if (err) {
                    return reject(err);
                }

                var deps = body.packages[packageName];
                for(var i in deps) {
                    var version = i.indexOf('dev-') === 0 ? i.substr(4) : i;

                    if (semver.valid(version)) {
                        indices.releases[version] = {
                            name: version,
                            type: 'release',
                            url: deps[i].dist.url.replace(/zipball/, 'tarball')
                        };
                    } else {
                        indices.devs[version] = {
                            name: version,
                            type: 'dev',
                            url: deps[i].dist.url.replace(/zipball/, 'tarball')
                        };
                    }
                }


                resolve(indices);
            }).on('error', reject);
        });
    },

    normalizeUrl: function(queryUrl) {
        'use strict';

        if (this.support(queryUrl)) {
            return queryUrl;
        }

        return 'https://packagist.org/p/' + queryUrl;
    },

    pull: function(fromPath, toPath) {
        'use strict';

        return Promise.denodeify(tmp.file)({ postfix: '.tar.gz' })
            .then(function(tmpPath, fd, cleanupCallback) {
                return new Promise(function(resolve, reject) {
                    var file = fs.createWriteStream(tmpPath);
                    var req = request({
                            url: fromPath + '?access_token=' + config.providers.github.token,
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
    }
};

module.exports = packagistProvider;