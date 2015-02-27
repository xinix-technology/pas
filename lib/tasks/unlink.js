var query = require('../query');

var UnlinkTask = function() {
    'use strict';

    this.description = 'Unlink to remove a package as dependency';
};

UnlinkTask.prototype.exec = function() {
    'use strict';

    return query()
        .then(function(q) {
            var currentPackage = q.get();

            if (this.args.length === 0) {
                this.report('message', 'Unlinking %s', currentPackage.url);

                return currentPackage.deleteLink();
            } else {
                this.report('message', '%s#%s unlinked', resolvedPackage.name, resolvedPackage.queriedVersion);

                return currentPackage.unlink(this.args[0] + '#master');
            }
        }.bind(this));
};

module.exports = new UnlinkTask();