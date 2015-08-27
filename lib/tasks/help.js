var path = require('path'),
    fs = require('fs');

module.exports = {
    description: 'Print help',

    exec: function(taskName) {
        'use strict';

        if (taskName) {
            var task;
            try {
                task = this.task(taskName);
            } catch(e) {
                throw e;
            }

            try {
                this.i('raw', this.task(taskName).doc() + '\n');
            } catch(e) {
                throw new Error('No documentation found for ' + taskName);
            }
        } else {
            this.i('raw', '%s %s - %s', 'pas'.green.bold, this.app.version.yellow.bold, 'package automation tools'.rainbow);

            this.i('raw', '');
            this.i('raw', 'Usage'.blue);
            this.i('raw', '  %s [task] [options..] [args..]', path.basename(process.argv[1]));
            this.i('raw', '');

            this.showTasks();
        }

    },

    showTasks: function() {
        'use strict';

        var stringUtil = this.require('util/string');
        var log = this.require('log');
        var manifestUtil = this.require('util/manifest');

        var i;

        this.i('raw', 'Tasks (global)'.blue);

        var registeredTasks = this.require('task').getRegisteredTasks();
        for(i in registeredTasks) {
            var task = registeredTasks[i];

            this.i('raw', '%s %s', stringUtil.pad(i, 20, null, '.'.grey).yellow, stringUtil.pad(task.description || '', 50));
        }

        // try {
        //     var tasks = manifestUtil(this.cwd).tasks;

        //     if (tasks) {
        //         this.i('raw', '');
        //         this.i('raw', 'Tasks (conf):');
        //         for (i in tasks) {
        //             this.i('raw', '  %s', stringUtil.pad(i, 20));
        //         }
        //     }

        // } catch(e) {
        //     // console.log(e.stack);
        // }
    }
};