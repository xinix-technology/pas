var path = require('path'),
    config = require('../config')(),
    fs = require('fs');

var HelpTask = function() {
    'use strict';

    this.description = 'Print help';
};

HelpTask.prototype.exec = function() {
    'use strict';

    this.report('header', 'pas is package automation tools.');
    this.report('message','version : %s', config.version);
    this.report('message','node    : %s\n', process.version);
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

    try {
        data = [];
        var tasks = require(path.join(config.cwd, 'pas.json')).tasks;

        this.report('header', 'Tasks (conf):');
        for (var i in tasks) {
            data.push({
                _: '',
                name: i,
                description: typeof tasks[i] === 'string' ? tasks[i] : (tasks[i].join(' ') + ' (spawned)')
            });
        }

        this.report('data', data);
    } catch(e) {}
};

module.exports = new HelpTask();