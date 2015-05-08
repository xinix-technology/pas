var semver = require('semver'),
    fs = require('fs'),
    path = require('path'),
    config = require('../config')(),
    query = require('../query'),
    task = require('../task'),
    spawn = require('child_process').spawn;

var session = {};

var installTask = module.exports = {
    description: 'Install package to use',

    // FIXME preInstall and postInstall should work inside the pkg#install
    // not from task
    exec: function(pUrl) {
        'use strict';

        if (arguments.length > 0) {
            return this.install(pUrl);
        } else {
            var p;
            return query()
                .then(function(localP) {
                    p = localP;
                    return p.preInstall();
                })
                .then(function(skipInstall) {
                    // installing sub modules

                    var promise = Promise.resolve();

                    p.modules.forEach(function(dir) {
                        promise = promise.then(function() {
                            this.report('message', '[%s] installing module on "%s"', p.name, dir);
                            return new Promise(function(resolve, reject) {
                                var sub = spawn(process.env._, ['install'], {
                                    cwd: path.join(config.cwd, dir),
                                    stdio: 'inherit'
                                });
                                sub.on('error', function(err) {
                                    reject(err);
                                });
                                sub.on('close', function(code) {
                                    if (code === 0 || code === '0') {
                                        resolve();
                                    } else {
                                        reject(new Error('Error on installing module.'));
                                    }
                                });
                            });
                        }.bind(this));
                    }.bind(this));

                    return promise.then(function() {
                        return skipInstall;
                    });
                }.bind(this))
                .then(function(skipInstall) {
                    if (skipInstall) {
                        return;
                    }
                    var dependencies = p.dependencies || {};
                    return this.bulkInstall(dependencies);
                }.bind(this))
                .then(function() {
                    return p.postInstall();
                });
        }
    },

    bulkInstall: function(dependencies) {
        'use strict';

        dependencies = dependencies || {};

        var promise = Promise.resolve();
        var installs = [];

        Object.keys(dependencies).forEach(function(i) {
            var dependency = dependencies[i];
            if (dependency.indexOf(':') === -1) {
                dependency = i + '#' + dependency;
            }

            installs.push(this.install(dependency));
        }.bind(this));

        return Promise.all(installs);
    },

    install: function(packageUrl) {
        'use strict';

        // TODO this is to make sure not duplicated but it is not perfect yet
        // no version checking
        if (session[packageUrl]) {
            return;
        } else {
            session[packageUrl] = packageUrl;
        }

        var p;
        // this.report('message', 'Installing %s ...', packageUrl);
        return query(packageUrl)
            .then(function(pArg) {
                p = pArg;

                return task({ _: ['pull', p] });
            }).then(function() {

                var proceedInstall = true;
                var existingVersion = p.getInstalledVersion();

                if (existingVersion) {
                    if (!semver.valid(existingVersion) && (existingVersion === 'master' || p.version !== 'master')) {
                        proceedInstall = false;
                    } else if (semver.valid(p.version) && semver.gte(existingVersion, p.version)) {
                        proceedInstall = false;
                    }
                }

                // console.log(p.name, existingVersion, p.version, proceedInstall);

                if (proceedInstall) {
                    return p.install()
                    // return task({ _: ['link', p] })
                        .then(function() {
                            return p.postInstall();
                        })
                        .then(function() {
                            return this.bulkInstall(p.dependencies);
                        }.bind(this))
                        .then(function() {
                            this.report('rewrite', '[%s] installed from %s', p.name, p.url);
                        }.bind(this));
                }
            }.bind(this));
    },


};