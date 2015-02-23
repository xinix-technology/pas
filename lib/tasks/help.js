var path = require('path'),
    fs = require('fs');

var HelpTask = function() {
    'use strict';

    this.description = 'Print help';
};

HelpTask.prototype.exec = function() {
    'use strict';

    this.report('header', 'reek package management\n');
    this.report('data', 'Usage: %s [task] [options..] [args..]\n', path.basename(process.argv[1]));

    this.showTasks();
};

HelpTask.prototype.showTasks = function() {
    'use strict';

    var data = [];
    this.report('header', 'Tasks (without plugins):');

    fs.readdirSync(__dirname).forEach(function(file) {
        var splitted = file.split('.'),
            task = require('./' + splitted[0]);

        data.push({
            _: '',
            name: splitted[0],
            description: task.description || '.'
        });
    }.bind(this));

    this.report('data', data);
};

module.exports = new HelpTask();