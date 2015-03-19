var path = require('path'),
    fs = require('fs'),
    config = require('./config')(),
    reporter = require('./reporter'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    tty = require('tty');

var Task = function(argv) {
    'use strict';

    var proto;

    this.opts = argv;
    this.args = argv._.slice(1);
    this.reporter = reporter;

    try {
        this.customRun = require(path.join(config.cwd, 'pas.json')).tasks[argv._[0]];
        if (this.customRun) {
            return;
        }
    } catch(e) {
        this.customRun = null;
    }

    var splitted = argv._[0].split(':'),
        taskName = splitted[0],
        pathSuffix = splitted.join('/');

    var TASKS = task.getRegisteredTasks();
    if (TASKS[argv._[0]]) {
        proto = TASKS[argv._[0]];
    } else {
        var protoPaths = [
            path.join(config.pluginHome, 'pas-' + taskName, 'tasks', splitted[1] || 'index'),
            path.join(config.cwd, 'node_modules', 'pas-' + taskName, 'tasks', splitted[1] || 'index')
        ];

        var es = [];
        var found = protoPaths.some(function(protoPath) {
            try {
                proto = require(protoPath);
                return true;
            } catch(e) {
                es.push(e);
                return;
            }
        });

        if (!found) {
            throw new Error('Task "' + argv._[0] + '" not found or error');
        }
    }

    if (typeof proto === 'function') {
        this.exec = proto;
    } else {
        for(var i in proto) {
            this[i] = proto[i];
        }
    }
};

Task.prototype.require = function(name) {
    'use strict';

    return require('./' + name);
};

Task.prototype.report = function(type) {
    'use strict';

    var args = arguments; // Array.prototype.slice.call(arguments, 1);
    this.reporter.print.apply(this.reporter, args);
};

Task.prototype.run = function() {
    'use strict';

    return this.exec.apply(this, this.args);
};

Task.prototype.exec = function() {
    'use strict';

    if (!this.customRun) {
        throw new Error('No custom taskRun or invalid task');
    }


    var onOut = function(line) {
        this.report('message', '%s', line);
    }.bind(this);

    var onErr = function(line) {
        this.report('message', '%s', line);
    }.bind(this);

    var execPromise = function(cmd) {
        return new Promise(function(resolve, reject) {
            this.report('message', '-> %s', cmd);

            exec(cmd, function(err, stdout, stderr) {
                if (err) {
                    return reject(err);
                }


                stdout = stdout.trim().split('\n');
                if (stdout.length > 0 && stdout[0] !== '') {
                    stdout.forEach(onOut);
                }

                stderr = stderr.trim().split('\n');
                if (stderr.length > 0 && stderr[0] !== '') {
                    stderr.forEach(onErr);
                }

                resolve();

            }.bind(this));
        }.bind(this));
    }.bind(this);

    if (typeof this.customRun === 'string') {
        return execPromise(this.customRun);
    } else {
        var promise = Promise.resolve();

        this.customRun.forEach(function(cmd) {
            if (typeof cmd === 'string') {
                promise = promise.then(function() {
                    return execPromise(cmd);
                }.bind(this));
            } else {
                promise = promise.then(function() {
                    return new Promise(function(resolve, reject) {
                        this.report('message', '-> %s', cmd);

                        var taskRun = spawn(cmd[0], cmd.slice(1), {stdio:'inherit'});

                        taskRun.on('exit', function(code) {
                            if (code === 0 || code === '0') {
                                this.report('message', 'Exit successfully');
                                resolve();
                            } else {
                                reject(new Error('Exit with error code: ' + code));
                            }
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            }
        }.bind(this));

        return promise;
    }
};

var getTask = function(argv) {
    'use strict';

    return new Task(argv);
};

var task = function(argv) {
    'use strict';

    return Promise.resolve(getTask(argv).run());
};

task.Task = Task;
task.get = getTask;
task.getRegisteredTasks = function() {
    return {
        'config': require('./tasks/config'),
        'deps': require('./tasks/deps'),
        'help': require('./tasks/help'),
        'info': require('./tasks/info'),
        'init': require('./tasks/init'),
        'install': require('./tasks/install'),
        'link': require('./tasks/link'),
        'plugin': require('./tasks/plugin'),
        'plugin:install': require('./tasks/plugin/install'),
        'pull': require('./tasks/pull'),
        'search': require('./tasks/search'),
        'uninstall': require('./tasks/uninstall'),
        'unlink': require('./tasks/unlink'),
        'update': require('./tasks/update'),
        'module': require('./tasks/module'),
        'module:add': require('./tasks/module/add'),
        'deploy': require('./tasks/deploy'),
        'deploy:list': require('./tasks/deploy/list'),
        'deploy:add': require('./tasks/deploy/add'),
        'deploy:remove': require('./tasks/deploy/remove'),
    };
};
module.exports = task;