var argv = require('minimist')(process.argv.slice(2)),
    path = require('path'),
    fs = require('fs'),
    sys = require('sys'),
    Cmd = require('./cmd');

var Reek = function() {
    'use strict';

    var homeDir = path.join(process.env.HOME, '.reek'),
        config,
        configFile;

    this.config = {
        home: homeDir,
        repository: path.join(homeDir, 'repository'),
        cwd: process.cwd(),
        debug: process.env.REEK_DEBUG > 0 ? true : false
    };

    try {
        this.package = require(path.join(this.config.cwd, 'reek.json'));
        this.package.initialized = true;
    } catch(e) {
        this.package = {};
    }

    configFile = path.join(this.config.home, 'reek.json');
    if (!fs.existsSync(configFile)) {
        configFile = path.join(__dirname, '../reek.json');
    }
    config = require(configFile);
    for(var i in config) {
        if (this.package[i] === undefined) {
            this.package[i] = config[i];
        }
    }
};

Reek.prototype.print = function() {
    'use strict';

    sys.print(sys.format.apply(sys, arguments) + "\n");
};

Reek.prototype.printErr = function() {
    'use strict';

    var e = arguments[arguments.length - 1],
        args = arguments;
    if (e instanceof Error) {
        args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
    } else {
        e = null;
    }

    if (this.config.debug && e) {
        sys.error(e.stack);
    } else {
        sys.error('E: ' + sys.format.apply(sys, args));
    }
};

Reek.prototype.process = function() {
    'use strict';

    var cmd;

    try {
        if (argv._.length === 0) {
            this.processGlobal(argv);
        } else {
            cmd = this.getCommand(argv);

            cmd.exec(this.execReporter.bind(this));
        }
    } catch(e) {
        this.execReporter(e);
    }
};

Reek.prototype.processGlobal = function(argv) {
    'use strict';

    if (argv.h) {
        this.getCommand({
                _: ['help']
            })
            .exec(this.execReporter.bind(this));
    }
};

Reek.prototype.execReporter = function(err) {
    if (err) {
        this.printErr(err.message, err);
        process.exit(1);
    }
    this.print('.done');
};

Reek.prototype.getCommand = function(argv) {
    'use strict';

    return new Cmd(this, argv);
};

module.exports = new Reek();