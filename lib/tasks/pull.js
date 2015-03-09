var query = require('../query');

var PullTask = function() {
    'use strict';

    this.description = 'Pull package to local repository cache';
};

PullTask.prototype.exec = function() {
    'use strict';

    switch(this.args.length) {
        case 0:
            return Promise.reject(new Error('No package to pull, please specify package name or query'));
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
                    this.report('rewrite', '[%s] pulling from %s', p.name || '(current)', p.url);
                    return p.pull();
                }.bind(this))
                .then(function() {
                    p.initialize();
                });
    }
};

module.exports = new PullTask();