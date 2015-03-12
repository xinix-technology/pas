var semver = require('semver'),
    fs = require('fs'),
    path = require('path'),
    query = require('../query'),
    task = require('../task');

var session = {};

var installTask = module.exports = {
    exec: function() {
        'use strict';

        if (this.args.length > 0) {
            return this.install(this.args[0]);
        } else {
            var p;
            return query()
                .then(function(localP) {
                    p = localP;
                    return p.preInstall();
                })
                .then(function() {
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

            installs.push(this.install(dependency, i));
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
                    return task({ _: ['link', p] })
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

installTask.description = 'Install package to use';