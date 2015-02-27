var path = require('path'),
    fs = require('fs'),
    config = require('./config')(),
    reporter = require('./reporter'),
    Promise = require('promise');

var Task = function(argv) {
    'use strict';

    var proto;

    this.opts = argv;
    this.args = argv._.slice(1);

    var splitted = argv._[0].split(':'),
        taskName = splitted[0],
        pathSuffix = splitted.join('/');
    var protoPath = path.join(__dirname, 'tasks', pathSuffix);

    if (!fs.existsSync(protoPath + '.js')) {
        protoPath = path.join(config.pluginHome, 'pas-' + taskName, 'tasks', splitted[1]);
    }

    if (!fs.existsSync(protoPath + '.js')) {
        protoPath = path.join(config.cwd, 'pas-' + taskName, 'tasks', splitted[1]);
    }

    try {
        proto = require(protoPath);
    } catch(e) {
        throw new Error('Task "' + argv._[0] + '" not found or error. [' + e + ']');
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

Task.prototype.require = function(name) {
    'use strict';

    return require('./' + name);
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