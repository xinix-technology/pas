var sys = require('sys'),
    Table = require('easy-table'),
    config = require('./config')();

var reporter = {
    print: function(message) {
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
            console.log(message);
        } else {
            console.log(sys.format.apply(sys, arguments));
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
            console.error('E: ' + e.message);
            if (e.stack) {
                console.error(e.stack);
            }
        } else {
            console.error('E: ' + sys.format.apply(sys, args));
        }
    }
};

module.exports = reporter;