var pkg = require('../pkg'),
    query = require('../query'),
    index = require('../index');

var PullTask = function() {
    'use strict';

    this.description = 'Pull package to local repository cache';
};

PullTask.prototype.exec = function(cb) {
    'use strict';

    if (this.args[0]) {
        var q = query(this.args[0]);

        index(q.name, function(err, packageIndex) {
            if (err) {
                return cb(err);
            }

            packageIndex.pull(q.version, function(err, satisfied) {
                if (err) {
                    return cb(err);
                }

                this.report('message', '%s#%s pulled', q.name, satisfied);
                cb();
            }.bind(this));
        }.bind(this));
    } else {
        cb(new Error('No package to pull, please specify package name or query'));
    }
};

module.exports = new PullTask();