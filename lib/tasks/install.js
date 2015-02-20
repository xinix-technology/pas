var Promise = require('promise'),
    semver = require('semver'),
    pkg = require('../pkg'),
    query = require('../query'),
    index = require('../index'),
    task = require('../task');

var InstallTask = function() {
    'use strict';

    this.description = 'Install package to use';
};

InstallTask.prototype.exec = function(cb) {
    'use strict';

    if (this.args.length > 0) {
        this.singleInstall(cb);
    } else {
        var dependencies = pkg().dependencies || {};
        this.manifestInstall(dependencies, cb);
    }
};

InstallTask.prototype.manifestInstall = function(dependencies, cb) {
    'use strict';

    var installs = [],
        depKeys = Object.keys(dependencies);

    depKeys.forEach(function(key) {
        var dep = dependencies[key];
        installs.push(function() {
            return new Promise(function(resolve, reject) {
                task({
                    _: ['install', key + '#' + dep]
                }, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        }());
    });

    Promise.all(installs).then(function() {
        cb();
    }, function(err) {
        cb(err);
    });
};

InstallTask.prototype.singleInstall = function(cb) {
    'use strict';

    var q = query(this.args[0]);
    index(q.name, function(err, pIndex) {
        if (err) {
            return cb(err);
        }

        var version = pIndex.satisfy(q.version),
            packageUrl = q.name + '#' + version;

        (new Promise(function(resolve, reject) {
                var argv = {
                    _: ['pull', packageUrl]
                };

                task(argv, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
        }))
        .then(function() {
            return (new Promise(function(resolve, reject) {
                var argv = {
                    _: ['link', packageUrl]
                };

                task(argv, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            }));
        })
        .done(function() {
            this.report('message', '%s installed', q.name);

            if (this.opts.save) {
                var p = pkg(),
                    manifest = p.readManifest();

                manifest.dependencies = manifest.dependencies || {};
                manifest.dependencies[q.name] = semver.validRange(version) ? '~' + version : version;

                p.writeManifest(manifest);
            }

            cb();
        }.bind(this), cb);
    }.bind(this));
};

module.exports = new InstallTask();