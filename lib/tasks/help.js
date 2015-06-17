var path = require('path'),
    fs = require('fs');

module.exports = {
    description: 'Print help',

    exec: function(taskName) {
        'use strict';

        if (taskName) {
            try {

                var doc = fs.readFileSync(path.join(__dirname, '../../docs/tasks', taskName + '.md'), 'utf8').trim();
                this.i('raw', doc + '\n');
            } catch(e) {
                throw new Error('No documentation found for ' + taskName);
            }
        } else {
            this.i('raw', 'pas is package automation tools.');

            this.i('raw', '  version : %s', this.app.version);
            this.i('raw', '  node    : %s', process.version);
            this.i('raw', '');
            this.i('raw', 'Usage: %s [task] [options..] [args..]', path.basename(process.argv[1]));
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

        this.i('raw', 'Tasks (without plugins):');

        var registeredTasks = this.require('task').getRegisteredTasks();
        for(i in registeredTasks) {
            var task = registeredTasks[i];

            this.i('raw', '  %s: %s', stringUtil.pad(i, 20), stringUtil.pad(task.description || '', 50));
        }

        try {
            var tasks = manifestUtil(this.cwd).tasks;

            if (tasks) {
                this.i('raw', '');
                this.i('raw', 'Tasks (conf):');
                for (i in tasks) {
                    this.i('raw', '  %s', stringUtil.pad(i, 20));
                }
            }

        } catch(e) {
            console.log(e.stack);
        }
    }
};