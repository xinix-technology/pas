
var UninstallTask = function() {
    'use strict';
};

UninstallTask.prototype.exec = function(cb) {
    'use strict';

    if (this.args.length === 0) {
        return cb(new Error('Package not found'));
    }

    pkg().unlink(this.args[0], function(err, resolvedPackage) {
        if (err) {
            return cb(err);
        }

        this.report('message', '%s uninstalled', resolvedPackage.name);
        cb();
    }.bind(this));
};

module.exports = new UninstallTask();