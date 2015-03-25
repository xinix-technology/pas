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
    this.report('message','version: %s', config.version);
    this.report('message','node   : %s', process.version);
    this.report('', '');
    this.report('data', 'Usage: %s [task] [options..] [args..]\n', path.basename(process.argv[1]));
    this.report('', '');

    this.showTasks();
};

HelpTask.prototype.showTasks = function() {
    'use strict';

    var i;
    var data = [];
    this.report('header', 'Tasks (without plugins):');

    var registeredTasks = require('../task').getRegisteredTasks();
    for(i in registeredTasks) {
        var task = registeredTasks[i];

        data.push({
            name: i,
            description: task.description || '.'
        });
    }
    this.report('data', data);


    try {
        data = [];
        var tasks = require('./pkg').manifest().tasks;

        this.report('', '');
        this.report('header', 'Tasks (conf):');
        for (i in tasks) {
            data.push({
                name: i,
                description: typeof tasks[i] === 'string' ? tasks[i] : (tasks[i].join(' ') + ' (spawned)')
            });
        }

        this.report('data', data);
    } catch(e) {}
};

module.exports = new HelpTask();