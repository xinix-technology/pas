var url = require('url'),
    // tmp = require('tmp'),
    // fs = require('fs'),
    semver = require('semver'),
    request = require('request'),
    // tar = require('tar'),
    // zlib = require('zlib'),
    config = require('../config')();
    // GitHubApi = require('github'),
    // github_,
    // getGithub = function() {
    //     'use strict';

    //     if (github_) {
    //         return github_;
    //     }

    //     github_ = new GitHubApi({
    //         // required
    //         version: '3.0.0',
    //         // optional
    //         // debug: true,
    //         // protocol: 'https',
    //         // host: 'github.my-GHE-enabled-company.com',
    //         // pathPrefix: '/api/v3', // for some GHEs
    //         // timeout: 5000,
    //         headers: {
    //             'user-agent': 'Pas-Package-Management' // GitHub is happy with a unique user agent
    //         }
    //     });

    //     if (config.providers && config.providers.github && config.providers.github.token) {
    //         github_.authenticate({
    //             type: 'oauth',
    //             token: config.providers.github.token
    //         });
    //     }

    //     return github_;
    // };

// tmp.setGracefulCleanup();

var packagistProvider = {
    support: function(packageUrl) {
        'use strict';

        if (packageUrl.indexOf('packagist:') === 0 ||
            packageUrl.indexOf('https://packagist.org/p/') === 0) {
            return true;
        }
    },

    // parse: function(packageUrl) {
    //     'use strict';

    //     var parsed = url.parse(packageUrl),
    //         name = parsed.protocol === 'packagist:' ? parsed.hostname + parsed.pathname : parsed.pathname.match(/^\/p\/(.+)$/)[1],
    //         splitted = name.split('/');

    //     var version = parsed.hash ? decodeURIComponent(parsed.hash.substr(1)) : '';
    //     var c = {
    //         url: packageUrl,
    //         name: name,
    //         version: version,
    //         vendor: splitted[0],
    //         unit: splitted[1],
    //     };
    //     return c;
    // },

    fetchIndices: function(queryUrl) {
        'use strict';

         var parsed = this.parse(queryUrl),
            vendor = parsed.vendor,
            unit = parsed.unit;

        var packageName = parsed.name;
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

                    if (deps[i].source.type === 'git') {
                        var provider = require('../provider');
                        var dispatchProvider = provider.detect(deps[i].source.url).name;
                        var dispatchUrl;
                        if (dispatchProvider === 'github') {
                            dispatchUrl = deps[i].dist.url.replace('zipball', 'tarball');
                        } else {
                            throw new Error('Packagist: Unimplemented non-github yet. ' + dispatchProvider);
                        }

                        if (semver.valid(version)) {
                            indices.releases[version] = {
                                name: version,
                                type: 'release',
                                dispatch: dispatchProvider,
                                url: dispatchUrl,
                            };
                        } else {
                            indices.devs[version] = {
                                name: version,
                                type: 'dev',
                                dispatch: dispatchProvider,
                                url: dispatchUrl,
                            };
                        }

                    } else {
                        throw new Error('Packagist: Unimplemented dependency source from: ' + deps[i].source.type);
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

        return 'packagist:' + queryUrl;
    },

    pull: function(from, toPath) {
        'use strict';

        if (from.dispatch) {
            var provider = require('../provider');
            return provider(from.dispatch).pull(from, toPath);
        } else {
            throw new Error('Packagist does not implemented own pull yet, dispatch must exists');
        }

        // return Promise.denodeify(tmp.file)({ postfix: '.tar.gz' })
        //     .then(function(tmpPath, fd, cleanupCallback) {
        //         return new Promise(function(resolve, reject) {
        //             var file = fs.createWriteStream(tmpPath);
        //             var tokenSuffix = '';
        //             if (config.providers && config.providers.github && config.providers.github.token) {
        //                 tokenSuffix = '?access_token=' + config.providers.github.token;
        //             }
        //             var req = request({
        //                     url: fromPath + tokenSuffix,
        //                     headers: getGithub().config.headers
        //                 });

        //             req.on('response', function(resp) {
        //                     if (resp.statusCode >= 200 && resp.statusCode < 300) {
        //                         req.pipe(file);
        //                     } else {
        //                         var chunks = [];
        //                         resp.on('data', function(chunk) {
        //                             chunks.push(chunk);
        //                         });
        //                         resp.on('end', function(chunk) {
        //                             var buff = Buffer.concat(chunks);
        //                             reject(new Error(JSON.parse(buff).message));
        //                         });
        //                     }
        //                 })
        //                 .on('error', reject);

        //             file.on('finish', function() {
        //                 var fis = fs.createReadStream(tmpPath),
        //                     gzs = fis.pipe(zlib.createGunzip()),
        //                     extractor = tar.Extract({
        //                         path: toPath,
        //                         strip: 1
        //                     }),
        //                     ts = gzs.pipe(extractor);

        //                 fis.on('error', reject);
        //                 gzs.on('error', reject);
        //                 extractor
        //                     .on('error', reject)
        //                     .on('end', resolve);
        //                 ts.on('error', reject);
        //             });
        //         });
        //     });

    }
};

module.exports = packagistProvider;