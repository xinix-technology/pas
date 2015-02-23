var query = require('../query'),
    Promise = require('promise');

var PullTask = function() {
    'use strict';

    this.description = 'Pull package to local repository cache';
};

PullTask.prototype.exec = function() {
    'use strict';

    switch(this.args.length) {
        case 0:
            return Promise.reject(new Error('No package to pull, please specify pacjage name or query'));
        default:
            var p,
                promise,
                packageUrlOrObject = this.args[0];

            if (typeof packageUrlOrObject === 'object') {
                p = packageUrlOrObject;
                promise = Promise.resolve();
            } else {
                promise = query(packageUrlOrObject)
                    .then(function(q) {
                        p = q.get();
                    });

            }
            return promise
                .then(function() {
                    return p.pull();
                })
                .then(function() {
                    p.initialize();
                    this.report('message', '[%s] %s pulled', p.name, p.url);
                }.bind(this));
    }

    // if (this.args[0]) {
    //     var q = query(this.args[0]);

    //     index(q.name, function(err, packageIndex) {
    //         if (err) {
    //             return cb(err);
    //         }

    //         packageIndex.pull(q.version, function(err, satisfied) {
    //             if (err) {
    //                 return cb(err);
    //             }

    //             this.report('message', '%s#%s pulled', q.name, satisfied);
    //             cb();
    //         }.bind(this));
    //     }.bind(this));
    // } else {
    //     cb(new Error('No package to pull, please specify package name or query'));
    // }
};

module.exports = new PullTask();