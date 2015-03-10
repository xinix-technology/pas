var task = require('../task');

var uninstallTask = function() {
    'use strict';

    return task({ _: ['unlink', this.args[0]] });
};

uninstallTask.description = 'Uninstall dependency';

module.exports = uninstallTask;