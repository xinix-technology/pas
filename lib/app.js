var argv = require('minimist')(process.argv.slice(2)),
    reporter = require('./reporter'),
    task = require('./task');

var App = function() {
    'use strict';
};

App.prototype.run = function() {
    'use strict';

    // TODO should we check if online?
    // require('dns').resolve('www.google.com', function(err) {
    //     if (err) {
    //         config.online = false;
    //     }
    // }.bind(this));

    try {
        if (argv._.length === 0) {
            this.processGlobal(argv);
        } else {
            task(argv).then(this.onDone.bind(this), this.onError.bind(this));
        }
    } catch(e) {
        this.onError(e);
    }

};

App.prototype.processGlobal = function(argv) {
    'use strict';

    if (Object.keys(argv).length === 1) {
        argv.h = true;
    }

    if (argv.h) {
        task({ _: ['help'] }).then(this.onDone.bind(this), this.onError.bind(this));
    }
};

App.prototype.onDone = function() {
    'use strict';

    reporter.print('.done');
};

App.prototype.onError = function(err) {
    'use strict';

    reporter.error(err.message, err);
    reporter.print('.error');
    process.exit(1);
};

App.prototype.getTask = function(argv) {
    'use strict';

    return new Task(argv);
};

module.exports = new App();