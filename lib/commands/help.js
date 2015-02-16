var path = require('path'),
    fs = require('fs'),
    Table = require('easy-table');

var HelpCmd = function() {
    'use strict';

    this.description = 'Print help';
};

HelpCmd.prototype.exec = function(cb) {
    'use strict';

    this.message('result', 'reek package management\n');
    this.message('result', 'Usage: %s [command] [options..] [args..]\n', path.basename(process.argv[1]));

    this.showCommands();

    cb();
};

HelpCmd.prototype.showCommands = function() {
    'use strict';

    this.message('result', 'Commands (without plugins):');
    var ls = fs.readdirSync(__dirname),
        t = new Table();

    ls.forEach(function(file) {
        var splitted = file.split('.'),
            cmd = require('./' + splitted[0]);

        t.cell('-', '');
        t.cell('Name', splitted[0]);
        t.cell('Description', cmd.description || '.');
        t.newRow();
    }.bind(this));
    this.message('result', t.print());
};

module.exports = new HelpCmd();