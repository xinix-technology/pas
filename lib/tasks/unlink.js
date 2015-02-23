
var UnlinkTask = function() {
    'use strict';

    this.description = 'Unlink to remove a package as dependency';
};

UnlinkTask.prototype.exec = function(cb) {
    'use strict';

    var currentPackage = pkg();

    if (this.args.length === 0) {
        currentPackage.deleteLink(function(err) {
            if (err) {
                return cb(err);
            }
            this.report('message', '%s#%s unlinked', currentPackage.name, 'link');
            cb();
        }.bind(this));
    } else {
        currentPackage.unlink(this.args[0] + '#link', function(err, resolvedPackage) {
            if (err) {
                return cb(err);
            }
            this.report('message', '%s#%s unlinked', resolvedPackage.name, resolvedPackage.queriedVersion);
        }.bind(this));
    }
};

module.exports = new UnlinkTask();