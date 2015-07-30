/**
 * Copyright (c) 2015 Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var objectUtil = require('./util/object'),
    inflection = require('inflection'),
    path = require('path'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    proto = require('./proto');

var TASKS = {
    'config': require('./tasks/config'),
    'up': require('./tasks/up'),
    'help': require('./tasks/help'),
    'version': require('./tasks/version'),
    'init': require('./tasks/init'),
    'install': require('./tasks/install'),
    'link': require('./tasks/link'),
    'plugin': require('./tasks/plugin'),
    'update': require('./tasks/update'),
    'module': require('./tasks/module'),
    'deploy': require('./tasks/deploy'),
};

var Task = module.exports = function(app, id) {
    'use strict';

    if (!(this instanceof Task)) return new Task(app, id);

    this.id = id;

    Object.defineProperties(this, {
        app: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: app
        }
    });

    this.options = {};
    this.args = [];

    var taskProto;

    // custom run
    try {
        var customTasks = require(path.join(this.cwd, 'pas.json')).tasks[this.id];
        if (customTasks) {
            this.exec = function() {
                var promise = Promise.resolve();

                customTasks.forEach(function(task) {
                    switch (typeof task) {
                        case 'string':
                            promise = promise.then(function() {
                                return new Promise(function(resolve, reject) {
                                    // this.i('i/exec', 'Executing ...');
                                    exec(task, function(err, message, errMessage) {

                                        message = message.trim();
                                        errMessage = errMessage.trim();

                                        if (message) {
                                            this.i('i/exec', message);
                                        }

                                        if (errMessage) {
                                            this.e(errMessage);
                                        }

                                        if (err) {
                                            return reject(new Error(err));
                                        }

                                        resolve();

                                    }.bind(this));
                                }.bind(this));
                            }.bind(this));
                            break;
                        case 'object':
                            promise = promise.then(function() {
                                return new Promise(function(resolve, reject) {
                                    // this.i('i/spawn', '<----------------');
                                    var taskSpawned = spawn(task[0], task.slice(1), {stdio: 'inherit'});

                                    taskSpawned.on('exit', function(status) {
                                        // this.i('i/spawn', '---------------->');
                                        if (status === 0) {
                                            resolve();
                                        } else {
                                            reject(new Error('Error with code: ' + status));
                                        }
                                    }.bind(this));
                                }.bind(this));
                            }.bind(this));
                            break;
                    }
                }.bind(this));

                return promise;
            };
            return;
        }
    } catch(e) {

    }

    // try to resolve task
    if (!taskProto && TASKS[this.id]) {
        taskProto = TASKS[this.id];
    }

    var singularForm = inflection.singularize(this.id);
    if (!taskProto && singularForm !== this.id && TASKS[singularForm]) {
        taskProto = TASKS[singularForm];
    }

    // plugin task
    if (!taskProto) {
        var segments = this.id.split(':');
        var plugin = this.plugins.entries['pas-' + segments[0]];

        try {
            var pluginDir = plugin.baseDirectory;
            taskProto = require(path.join(pluginDir, 'tasks', segments[1] || 'index'));
            this.plugin = plugin;
        } catch(e) {}
    }

    if (taskProto) {
        if (typeof taskProto === 'function') {
            Object.defineProperty(this, 'exec', {
                enumerable: false,
                writable: true,
                configurable: true,
                value: taskProto
            });
        } else {
            for(var i in taskProto) {
                Object.defineProperty(this, i, {
                    enumerable: false,
                    writable: true,
                    configurable: true,
                    value: taskProto[i]
                });
            }
        }
    } else {
        throw new Error('Task "' + this.id + '" not found');
    }
};

Task.prototype = proto();

Task.prototype.run = function() {
    'use strict';
    try {
        return Promise.resolve(this.exec.apply(this, this.args));
    } catch(e) {
        return Promise.reject(e);
    }
};

/**
 * Get and set task options
 * @param  {mixed} key
 * @param  {mixed} value
 * @return {mixed}
 */
Task.prototype.option = function(key, value) {
    'use strict';

    if (typeof key === 'object') {
        objectUtil.mixin(this.options, key);
        return this;
    }

    switch (arguments.length) {
        case 0:
            return this.options;
        case 1:
            return this.options[key] || null;
        default:
            if (value === null) {
                delete this.options[key];
            } else {
                this.options[key] = value;
            }
            return this;
    }
};

/**
 * Get and set task arguments
 * @param  {array} args
 * @return {mixed}
 */
Task.prototype.arg = function(args) {
    'use strict';

    if (arguments.length === 0) {
        return this.args;
    } else {
        this.args = args;
        return this;
    }
};

Task.getRegisteredTasks = function() {
    'use strict';

    return TASKS;
};

// var path = require('path'),
//     fs = require('fs'),
//     config = require('./config')(),
//     manifest = require('./manifest'),
//     log = require('./log'),
//     exec = require('child_process').exec,
//     spawn = require('child_process').spawn,
//     inflection = require('inflection'),
//     tty = require('tty');

// var Task = function(argv) {
//     'use strict';

//     var proto;

//     this.opts = argv;
//     this.args = argv._.slice(1);

//     try {
//         this.customRun = manifest().tasks[argv._[0]];
//         if (this.customRun) {
//             return;
//         }
//     } catch(e) {
//         this.customRun = null;
//     }

//     argv._[0] = inflection.singularize(argv._[0]);

//     var splitted = argv._[0].split(':'),
//         taskName = splitted[0],
//         pathSuffix = splitted.join('/');

//     var TASKS = task.getRegisteredTasks();
//     if (TASKS[argv._[0]]) {
//         proto = TASKS[argv._[0]];
//     } else {
//         var protoPaths = [
//             path.join(config.plugins.home, 'pas-' + taskName, 'tasks', splitted[1] || 'index'),
//             path.join(config.cwd, 'node_modules', 'pas-' + taskName, 'tasks', splitted[1] || 'index')
//         ];

//         var es = [];
//         var found = protoPaths.some(function(protoPath) {
//             try {
//                 proto = require(protoPath);
//                 return true;
//             } catch(e) {
//                 es.push(e);
//                 return;
//             }
//         });

//         if (!found) {
//             throw new Error('Task "' + argv._[0] + '" not found or error');
//         }
//     }

//     if (typeof proto === 'function') {
//         this.exec = proto;
//     } else {
//         for(var i in proto) {
//             this[i] = proto[i];
//         }
//     }
// };

// Task.prototype.run = function() {
//     'use strict';

//     return this.exec.apply(this, this.args);
// };

// Task.prototype.exec = function() {
//     'use strict';

//     if (!this.customRun) {
//         throw new Error('No custom taskRun or invalid task');
//     }


//     var onOut = function(line) {
//         log.i('message', '%s', line);
//     }.bind(this);

//     var onErr = function(line) {
//         log.i('message', '%s', line);
//     }.bind(this);

//     var execPromise = function(cmd) {
//         return new Promise(function(resolve, reject) {
//             log.i('message', '-> %s', cmd);

//             var env = Object.create(process.env);

//             this.args.forEach(function(arg, i) {
//                 env['ARG' + i] = arg;
//             });

//             var execOpts = {
//                 env: env
//             };

//             exec(cmd, execOpts, function(err, stdout, stderr) {
//                 if (err) {
//                     return reject(err);
//                 }

//                 stdout = stdout.trim().split('\n');
//                 if (stdout.length > 0 && stdout[0] !== '') {
//                     stdout.forEach(onOut);
//                 }

//                 stderr = stderr.trim().split('\n');
//                 if (stderr.length > 0 && stderr[0] !== '') {
//                     stderr.forEach(onErr);
//                 }

//                 resolve();

//             }.bind(this));
//         }.bind(this));
//     }.bind(this);

//     if (typeof this.customRun === 'string') {
//         return execPromise(this.customRun);
//     } else {
//         var promise = Promise.resolve();

//         this.customRun.forEach(function(cmd) {
//             if (typeof cmd === 'string') {
//                 promise = promise.then(function() {
//                     return execPromise(cmd);
//                 }.bind(this));
//             } else {
//                 promise = promise.then(function() {
//                     return new Promise(function(resolve, reject) {
//                         log.i('message', '-> %s', JSON.stringify(cmd));


//                         var env = Object.create(process.env);

//                         this.args.forEach(function(arg, i) {
//                             env['ARG' + i] = arg;
//                         });

//                         var spawnArgs = cmd.slice(1).map(function(arg) {

//                             for(var i in env) {
//                                 arg = arg.replace(new RegExp('\\\$' + i, 'g'), env[i]);
//                             }

//                             return arg;
//                         });

//                         var execOpts = {
//                             stdio:'inherit'
//                         };
//                         var taskRun = spawn(cmd[0], spawnArgs, execOpts);

//                         taskRun.on('close', function(code) {
//                             if (code === 0 || code === '0') {
//                                 log.i('message', 'Exit successfully');
//                                 resolve();
//                             } else {
//                                 reject(new Error('Exit with error code: ' + code));
//                             }
//                         }.bind(this));
//                     }.bind(this));
//                 }.bind(this));
//             }
//         }.bind(this));

//         return promise;
//     }
// };

// // var getTask = function(argv) {
// //     'use strict';

// // };

// var task = function(argv) {
//     'use strict';

//     return new Task(argv);
//     // return Promise.resolve(getTask(argv).run());
// };

// // task.run = function() {
// //     'use strict';

// //     var argv = {},
// //         lastArgI = arguments.length - 1;

// //     var lastArg = arguments[lastArgI];
// //     if (typeof lastArg === 'object') {
// //         argv = lastArg;
// //     } else {
// //         lastArgI = -1;
// //     }

// //     argv._ = [];

// //     Array.prototype.forEach.call(arguments, function(arg, i) {
// //         if (i !== lastArgI) {
// //             argv._.push(arg);
// //         }
// //     });

// //     console.log(argv);

// //     return task(argv);
// // };