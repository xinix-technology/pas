var path = require('path');

var Cmd = function(reek, argv) {
    'use strict';

    var args = [__dirname, 'commands'],
        script,
        cmd,
        proto;

    this.reek = reek;
    this.options = argv;

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

Cmd.prototype.message = function(type) {
    switch(type) {
        default:
            this.reek.print.apply(this.reek, Array.prototype.slice.call(arguments, 1));
    }
};


module.exports = Cmd;