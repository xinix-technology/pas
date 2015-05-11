require('./globals/timer');
require('./globals/promise');

var argv = require('minimist')(process.argv),
    reporter = require('./reporter'),
    config = require('./config')(),
    task = require('./task'),
    path = require('path');

var noArgsProcess = function(argv) {
    'use strict';

    if (Object.keys(argv).length === 1) {
        argv.h = true;
    }

    if (argv.h) {
        task({ _: ['help'] }).then(onDone, onError);
    } else if (argv.v) {
        task({ _: ['version'] }).then(onDone, onError);
    } else {
        throw new Error('Unknown option');
    }
};

var onDone = function() {
    'use strict';

    if (config.debug) {
        reporter.print('message', '.OK');
    }
};

var onError = function(err) {
    'use strict';

    reporter.error(err.message, err);

    if (config.debug) {
        reporter.print('message', '.ERR');
    }
    process.exit(1);
};

module.exports = {
    run: function() {
        'use strict';

        argv._ = argv._.slice(2);

        try {
            if (argv._.length === 0) {
                noArgsProcess(argv);
            } else {
                task(argv).then(onDone, onError);
            }
        } catch(e) {
            onError(e);
        }
    }
};