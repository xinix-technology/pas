var sys = require('sys'),
    Table = require('easy-table'),
    config = require('./config')();

var loader = ['|', '/', '-', '\\', '|', '/', '-', '\\'];
var loaderIndex = 0;

var reporter = {
    print: function(type, message) {
        'use strict';

        if (typeof message === 'object') {
            if (Array.isArray(message)) {
                // message = Table.printArray(message);
                message = Table.printArray(message, null, function (table) {
                    return table.print();
                });
            } else {
                message = Table.printObj(message);
                // message = Table.printObj(message, null, function (table) {
                //     return table.print();
                // });
            }
            // process.stdout.write('\x1B[0G\x1b[2K' + message);
            process.stdout.write(message + '\n');
        } else {

            var args = Array.prototype.slice.call(arguments, 1);

            // if (type === 'rewrite') {
            //     process.stdout.write('\x1b[1A\x1b[2K'/* + loader[loaderIndex] + ' '*/ + sys.format.apply(sys, args) + '\n');
            //     // loaderIndex++;
            //     // if (loaderIndex >= loader.length) {
            //     //     loaderIndex = 0;
            //     // }
            // } else {
                process.stdout.write(sys.format.apply(sys, args) + '\n');
            // }
        }
    },

    error: function() {
        'use strict';

        var e = arguments[arguments.length - 1],
            args = arguments;

        if (e instanceof Error) {
            args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        } else {
            e = null;
        }

        if (config.debug && e) {
            console.error('e| ' + e.message);
            if (e.stack) {
                console.error(e.stack);
            }
        } else {
            console.error('e| ' + sys.format.apply(sys, args));
        }
    }
};

module.exports = reporter;