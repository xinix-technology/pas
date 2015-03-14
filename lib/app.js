var START_TIME = new Date().getTime();

global.deltaT = function() {
    'use strict';

    return (new Date().getTime() - START_TIME) / 1000;
};

var argv = require('minimist')(process.argv),
    reporter = require('./reporter'),
    configInit = require('./config').init,
    config = require('./config')(),
    task = require('./task'),
    path = require('path');

if (!global.APP_LIB_DIR) {
    global.APP_LIB_DIR = path.resolve(__dirname);
}

argv._ = argv._.slice(2);

var PolyfillPromise = require('promise');
if (global.Promise) {
    for(var i in PolyfillPromise) {
        if (!global.Promise[i]) {
            global.Promise[i] = PolyfillPromise[i];
        }
    }
} else {
    global.Promise = PolyfillPromise;
}

var App = function() {
    'use strict';
};

App.prototype.run = function() {
    'use strict';

    configInit()
        .then(function() {
            try {
                if (argv._.length === 0) {
                    this.processGlobal(argv);
                } else {
                    task(argv).then(this.onDone.bind(this), this.onError.bind(this));
                }
            } catch(e) {
                this.onError(e);
            }
        }.bind(this), function(err) {
            this.onError(err);
        }.bind(this));
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

    if (config.debug) {
        reporter.print('message', '-> OK');
    }
};

App.prototype.onError = function(err) {
    'use strict';

    reporter.error(err.message, err);

    if (config.debug) {
        reporter.print('message', '-> ERR');
    }
    process.exit(1);
};

// App.prototype.getTask = function(argv) {
//     'use strict';

//     return new Task(argv);
// };

module.exports = new App();