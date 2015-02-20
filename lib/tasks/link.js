var path = require('path'),
    semver = require('semver'),
    fs = require('fs'),
    pkg = require('../pkg'),
    mkdirp = require('../fsutil').mkdirp;

var LinkTask = function() {
    'use strict';

    this.description = 'Link local directory as repository package';
};

LinkTask.prototype.exec = function(cb) {
    'use strict';

    if (this.args.length === 0) {
        this.provideLink(cb);
    } else {
        this.consumeLink(cb);
    }
};

LinkTask.prototype.consumeLink = function(cb) {
    'use strict';

    try {
        var currentPackage = pkg();
        currentPackage.link(this.args[0] + '#link', function(err, resolvedPackage) {
            this.report('message', '%s#%s linked', resolvedPackage.name, resolvedPackage.queriedVersion);
            cb();
        }.bind(this));
    } catch(e) {
        cb(e);
    }
};

LinkTask.prototype.provideLink = function(cb) {
    'use strict';

    var currentPackage = pkg();

    if (currentPackage.isInitialized) {
        currentPackage.createLink(function(err) {
            if (err) {
                return cb(err);
            }
            this.report('message', '%s#%s linked', currentPackage.name, 'link');
            cb();
        }.bind(this));
    } else {
        cb(new Error('Current directory is uninitialized yet'));
    }
};

module.exports = new LinkTask();