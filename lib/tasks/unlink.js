var query = require('../query');

var UnlinkTask = function() {
    'use strict';

    this.description = 'Unlink to remove a package as dependency';
};

UnlinkTask.prototype.exec = function() {
    'use strict';

    if (this.args.length === 0) {

        return query()
            .then(function(p) {
                return p.deleteLink();
            });
    } else {

        var p;
        return query().then(function(pArg) {
                p = pArg;
                return query(this.args[0]);
            }.bind(this))
            .then(function(pArg) {
                return p.unlink(pArg);
            }.bind(this))
            .then(function() {
                this.report('message', '%s unlinked', p.name);
            }.bind(this));
    }

};

module.exports = new UnlinkTask();