var tmp = require('tmp'),
Promise = require('promise'),
    request = require('request'),
    tar = require('tar'),
    zlib = require('zlib'),
    fs = require('fs'),
    GitHubApi = require('github'),
    github = new GitHubApi({
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

tmp.setGracefulCleanup();

var GithubProvider = function() {
    'use strict';
};

GithubProvider.prototype.fetchIndices = function(url, cb) {
    'use strict';

    var splitted = url.split('/');
    var indices = {
        releases: {},
        devs: {}
    };
    var githubParameters = {
        user: splitted[0],
        repo: splitted[1]
    };

    new Promise(function(resolve, reject) {
            try {
                github.repos.getTags(githubParameters, function(err, tags) {
                    if (err) {
                        return reject(err);
                    }

                    tags.forEach(function(tag) {
                        indices.releases[tag.name] = {
                            name: tag.name,
                            contentType: 'application/x-gzip',
                            url: 'https://api.github.com/repos/' + url + '/tarball/' + tag.name,
                            type: 'release'
                        };
                    });

                    resolve();
                });
            } catch(e) {
                reject(e);
            }
        }).then(function() {
            return (new Promise(function(resolve, reject) {
                github.repos.getBranches(githubParameters, function(err, branches) {
                    if (err) {
                        return reject(err);
                    }

                    branches.forEach(function(branch) {
                        indices.devs[branch.name] = {
                            name: branch.name,
                            contentType: 'application/x-gzip',
                            url: 'https://api.github.com/repos/' + url + '/tarball/' + branch.name,
                            type: 'dev'
                        };
                    });

                    resolve();
                });
            }));
        }).done(function() {
                cb(null, indices);
            }.bind(this), function(err) {
                cb(err);
            });
};

GithubProvider.prototype.pull = function(url, toPath, cb) {
    'use strict';

    tmp.file({ postfix: '.tar.gz' }, function(err, tmpPath, fd, cleanupCallback) {
        if (err) {
            return cb(err);
        }

        var file = fs.createWriteStream(tmpPath);

        request({
                url: url,
                headers: github.config.headers
            })
            .on('error', cb)
            .pipe(file);

        file.on('finish', function() {
            var fis = fs.createReadStream(tmpPath),
                gzs = fis.pipe(zlib.createGunzip()),
                extractor = tar.Extract({
                    path: toPath,
                    strip: 1
                }),
                ts = gzs.pipe(extractor);

            // var fi = fs.createReadStream(tmpPath),
            //     fo = fs.createWriteStream('/Users/jafar/test');
            // fi.pipe(fo);

            fis.on('error', cb);
            gzs.on('error', cb);
            extractor
                .on('error', cb)
                .on('end', function() {
                    cb();
                });
            ts.on('error', cb);
        });
    });
};

module.exports = new GithubProvider();