var sys = require('sys'),
    sprintf = require("sprintf-js").sprintf,
    Table = require('easy-table'),
    config = require('./config')();

var loader = ['|', '/', '-', '\\', '|', '/', '-', '\\'];
var loaderIndex = 0;

var lastLine = '';

var reporter = {
    print: function(type, message) {
        'use strict';

        var prefix = '%s';
        var prefixData = config.debug ? sprintf('%08.3f i| ', deltaT()) : '| ';

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

            message.trim().split(/\n/).forEach(function(line) {
                var currentLine = sprintf(prefix + '%s\n', prefixData, line.replace(/[\s]+$/, ''));
                if (currentLine === lastLine) {
                    return;
                }
                lastLine = currentLine;
                process.stdout.write(currentLine);
            });
        } else {

            var args = Array.prototype.slice.call(arguments, 1);

            // if (type === 'rewrite') {
            //     process.stdout.write('\x1b[1A\x1b[2K'/* + loader[loaderIndex] + ' '*/ + sys.format.apply(sys, args) + '\n');
            //     // loaderIndex++;
            //     // if (loaderIndex >= loader.length) {
            //     //     loaderIndex = 0;
            //     // }
            // } else {

            var lines = sprintf.apply(null, args);
            lines.trim().split(/\n/).forEach(function(line) {
                var currentLine = sprintf(prefix + '%s\n', prefixData, line);
                if (currentLine === lastLine) {
                    return;
                }
                lastLine = currentLine;
                process.stdout.write(currentLine);
            });
            // }
        }
    },

    error: function() {
        'use strict';

        var prefix = '%s';
        var prefixData = config.debug ? sprintf('%08.3f e| ', deltaT()) : '| ';

        var e = arguments[arguments.length - 1],
            args = arguments;

        if (e instanceof Error) {
            args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        } else {
            e = null;
        }

        if (config.debug && e) {
            process.stderr.write(sprintf(prefix + '-> %s\n', prefixData, e));
            if (e.stack) {
                e.stack.trim().split(/\n/).forEach(function(line) {
                    process.stderr.write(sprintf(prefix + '%s\n', prefixData, line));
                });
            }
        } else {
            process.stderr.write(sprintf(prefix + '-> %s\n', prefixData, e));
        }
    }
};

module.exports = reporter;