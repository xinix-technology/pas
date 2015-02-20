var path = require('path'),
    reporter = require('./reporter');

var Task = function(argv) {
    'use strict';

    var args = [__dirname, 'tasks'],
        proto;

    this.opts = argv;
    this.args = argv._.slice(1);

    args.push(argv._[0]);

    try {
        proto = require(path.join.apply(path, args));
    } catch(e) {
        throw new Error('Task not found');
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

var task = function(argv, cb) {
    'use strict';

    getTask(argv).exec(cb);
};

task.Task = Task;
task.get = getTask;

module.exports = task;