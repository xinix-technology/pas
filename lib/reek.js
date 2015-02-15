var path = require('path'),
    fs = require('fs'),
    sys = require('sys'),
    Cmd = require('./cmd');

var Reek = function() {
    'use strict';

    var homeDir = path.join(process.env.HOME, '.reek'),
        config,
        configFile;

    this.options = {
        home: homeDir,
        repository: path.join(homeDir, 'repository'),
        cwd: process.cwd()
    };

    try {
        this.package = require(path.join(this.options.cwd, 'reek.json'));
        this.package.initialized = true;
    } catch(e) {
        this.package = {};
    }

    configFile = path.join(this.options.home, 'reek.json');
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

    sys.error('E: ' + sys.format.apply(sys, arguments));
};

Reek.prototype.argv = function(argv) {
    'use strict';

    argv = argv || process.argv;

    return {
        _: argv.slice(2)
    };
};

Reek.prototype.process = function() {
    'use strict';

    var cmd;

    try {
        cmd = this.getCommand(this.argv());
    } catch(e) {
        this.printErr('Command not found.');
        process.exit(1);
    }

    cmd.exec(function(err) {
        if (err) {
            this.printErr(err.message);
            process.exit();
        }
        this.print('.');
    }.bind(this));

};

Reek.prototype.getCommand = function(argv) {
    'use strict';

    return new Cmd(this, argv);
};

module.exports = new Reek();