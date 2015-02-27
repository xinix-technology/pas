
// FIXME its not done yet, please check it
var uninstallTask = {
    exec: function() {
        'use strict';

        if (this.args.length === 0) {
            throw new Error('Package not found');
        }

        pkg().unlink(this.args[0], function(err, resolvedPackage) {
            if (err) {
                return Promise.reject(err);
            }

            this.report('message', '%s uninstalled', resolvedPackage.name);
        }.bind(this));
    }
};

module.exports = uninstallTask;