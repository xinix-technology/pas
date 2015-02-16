var path = require('path');

var Cmd = function(reek, argv) {
    'use strict';

    var args = [__dirname, 'commands'],
        script,
        proto;

    this.reek = reek;
    this.options = argv;
    this.params = argv._.slice(1);

    args.push(argv._[0]);
    script = path.join.apply(path, args);
    proto = require(script);

    if (typeof proto === 'function') {
        this.exec = proto;
    } else {
        for(var i in proto) {
            this[i] = proto[i];
        }
    }
};

Cmd.prototype.package = function(key) {
    'use strict';

    return this.reek.package[key] || null;
};

Cmd.prototype.config = function(key) {
    'use strict';

    return this.reek.config[key] || null;
};

Cmd.prototype.message = function(type) {
    'use strict';

    var args = Array.prototype.slice.call(arguments, 1);
    switch(type) {
        case 'warn':
            args[0] = 'W: ' + args[0];
            this.reek.print.apply(this.reek, args);
            break;
        default:
            this.reek.print.apply(this.reek, args);
    }
};

Cmd.prototype.execCommand = function(argv, cb) {
    'use strict';

    var cmd = this.reek.getCommand(argv);
    cmd.exec(cb);
};

module.exports = Cmd;