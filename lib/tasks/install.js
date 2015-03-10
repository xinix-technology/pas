var semver = require('semver'),
    query = require('../query'),
    task = require('../task');

var session = {};

var InstallTask = function() {
    'use strict';

    this.description = 'Install package to use';
};

InstallTask.prototype.exec = function() {
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
};

InstallTask.prototype.bulkInstall = function(dependencies) {
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
};

InstallTask.prototype.install = function(packageUrl) {
    'use strict';

    var p;

    // TODO this is to make sure not duplicated but it is not perfect yet
    // no version checking
    if (session[packageUrl]) {
        return;
    } else {
        session[packageUrl] = packageUrl;
    }

    // this.report('message', 'Installing %s ...', packageUrl);
    return query(packageUrl)
        .then(function(localP) {
            p = localP;
            return task({ _: ['pull', p] });
        })
        .then(function() {
            return task({ _: ['link', p] });
        })
        .then(function() {
            return p.postInstall();
        })
        .then(function() {
            return this.bulkInstall(p.dependencies);
        }.bind(this))
        .then(function() {
            this.report('rewrite', '[%s] installed from %s', p.name, p.url);
        }.bind(this));
};

module.exports = new InstallTask();