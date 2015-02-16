var name = require('../name'),
    tmp = require('tmp')
    semver = require('semver'),
    request = require('request'),
    path = require('path'),
    fs = require('fs'),
    url = require('url'),
    tar = require('tar'),
    zlib = require('zlib'),
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

var InstallCmd = function() {
    'use strict';

    this.description = 'Install package to use';
};

InstallCmd.prototype.exec = function(cb) {
    'use strict';

    var q,
        localPackagePath;

    if (this.params.length > 0) {

        q = name.query(this.params[0]);

        github.repos.getTags({
            user: q.vendor,
            repo: q.name
        }, function(err, gitTags) {
            if (err) {
                console.log(err)
                return cb(err);
            }

            var tags = [],
                version;


            for(var i = 0; i < gitTags.length; i++) {
                tags.push(gitTags[i].name);
            }

            version = semver.maxSatisfying(tags, q.version);

            gitTags.forEach(function(version) {
                tags.push(version.name);
            });

            var onFinish = function() {
                this.execCommand({
                    _: [ 'link', q.vendor + '/' + q.name + ':' + version ]
                }, function(err) {
                    this.message('result', '%s/%s:%s installed', q.vendor, q.name, version);
                    cb(err);
                }.bind(this));
            }.bind(this);

            if (!version) {
                version = 'master';
            }
            localPackagePath = path.join(this.config('repository'), q.vendor, q.name, version);

            if (fs.existsSync(localPackagePath)) {
                onFinish(cb);
            } else {
                tmp.file({ postfix: '.tar.gz' }, function(err, tmpPath, fd, cleanupCallback) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    var file = fs.createWriteStream(tmpPath),
                        url = 'https://api.github.com/repos/' + q.vendor + '/' + q.name + '/tarball/' + (version.indexOf('dev-') === 0 ? version.substr(4) : version),
                        onError = function(err) { console.log(err); cb(err) };

                    request({
                            url: url,
                            headers: github.config.headers
                        })
                        .on('error', onError)
                        .pipe(file);

                    file.on('finish', function() {
                        var fis = fs.createReadStream(tmpPath),
                            gzs = fis.pipe(zlib.createGunzip()),
                            extractor = tar.Extract({
                                path: localPackagePath,
                                strip: 1
                            }),
                            ts = gzs.pipe(extractor);

                        fis.on('error', onError);
                        gzs.on('error', onError);
                        extractor
                            .on('error', onError)
                            .on('end', function() {
                                onFinish(cb);
                            }.bind(this));
                        ts.on('error', onError);
                    }.bind(this));

                }.bind(this));
            }

        }.bind(this));
    }
};

module.exports = new InstallCmd();