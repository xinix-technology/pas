var path = require('path'),
    reporter = require('./reporter'),
    Promise = require('promise');

var Task = function(argv) {
    'use strict';

    var proto;

    this.opts = argv;
    this.args = argv._.slice(1);

    try {
        // proto = require(path.join.apply(path, args));
        proto = require(path.join(__dirname, 'tasks', argv._[0]));
    } catch(e) {
        throw new Error('Task "' + argv._[0] + '" not found');
    }

    if (typeof proto === 'function') {
        this.exec = proto;
    } else {
        for(var i in proto) {
            this[i] = proto[i];
        }
    }

    this.reporter = reporter;
};

Task.prototype.report = function(type) {
    'use strict';

    var args = Array.prototype.slice.call(arguments, 1);
    this.reporter.print.apply(this.reporter, args);
};

var getTask = function(argv) {
    'use strict';

    return new Task(argv);
};

var task = function(argv) {
    'use strict';

    return Promise.resolve(getTask(argv).exec());
};

task.Task = Task;
task.get = getTask;

module.exports = task;