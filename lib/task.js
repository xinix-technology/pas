var path = require('path'),
    fs = require('fs'),
    config = require('./config')(),
    reporter = require('./reporter'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    tty = require('tty');

var registeredTasks_ = {
    'config': require('./tasks/config'),
    'deps': require('./tasks/deps'),
    'help': require('./tasks/help'),
    'info': require('./tasks/info'),
    'init': require('./tasks/init'),
    'install': require('./tasks/install'),
    'link': require('./tasks/link'),
    'plugin': require('./tasks/plugin'),
    'pull': require('./tasks/pull'),
    'search': require('./tasks/search'),
    'uninstall': require('./tasks/uninstall'),
    'unlink': require('./tasks/unlink'),
    'update': require('./tasks/update'),
};

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

    if (registeredTasks_[argv._[0]]) {
        proto = registeredTasks_[argv._[0]];
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
            es.forEach(function(e) {
                console.log(e.stack);
            });
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

    this.report('message', 'Running: %s', typeof this.customRun === 'string' ? this.customRun : (this.customRun.join(' ') + ' (spawned)'));

    return new Promise(function(resolve, reject) {
        var onOut = function(line) {
            this.report('message', '    | %s', line);
        }.bind(this);

        var onErr = function(line) {
            this.report('message', '   e| %s', line);
        }.bind(this);

        if (typeof this.customRun === 'string') {
            exec(this.customRun, function(err, stdout, stderr) {
                if (err) {
                    return reject(err);
                }

                stdout = stdout.split('\n');
                if (stdout.length > 1) {
                    stdout.forEach(onOut);
                }

                stderr = stderr.split('\n');
                if (stderr.length > 1) {
                    stderr.forEach(onErr);
                }

            }.bind(this));
        } else {
            var onIn = function(c) {
                taskRun.stdin.write(c);
            };

            var taskRun = spawn(this.customRun[0], this.customRun.slice(1), {stdio:'inherit'});
            // process.stdin.resume();
            // process.stdin.on('data', onIn);

            // taskRun.stdout.on('data', function(c) {
            //     process.stdout.write(c);
            // });
            // taskRun.stderr.on('data', function(c) {
            //     process.stderr.write(c);
            // });

            // process.stdin.setRawMode(true);

            taskRun.on('exit', function(code) {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.removeListener('data', onIn);

                if (code === 0 || code === '0') {
                    this.report('message', 'Exit successfully');
                    resolve();
                } else {
                    reject(new Error('Exit with error code: ' + code));
                }
            }.bind(this));
        }
    }.bind(this));
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
    return registeredTasks_;
};
module.exports = task;