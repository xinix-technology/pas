var configModule = require('../config');

var flattenData = function(data, prefix) {
    'use strict';

    prefix = prefix || '';

    var retval = {},
        overrideRetval = {};

    for(var i in data) {
        if (typeof data[i] === 'object') {
            if (Array.isArray(data[i])) {
                if (data.hasOwnProperty(i)) {
                    overrideRetval[prefix + i] = data[i];
                } else {
                    retval[prefix + i] = data[i];
                }
            } else {
                var result = flattenData(data[i], prefix + i + '.');
                for(var j in result) {
                    if (data.hasOwnProperty(i)) {
                        overrideRetval[j] = result[j];
                    } else {
                        retval[j] = result[j];
                    }
                }
            }
        } else {
            if (data.hasOwnProperty(i)) {
                overrideRetval[prefix + i] = data[i];
            } else {
                retval[prefix + i] = data[i];
            }
        }
    }

    for(i in overrideRetval) {
        retval[i] = overrideRetval[i];
    }

    return retval;
};

var configTask = module.exports = function(key, value) {
    'use strict';

    if (this.opts.r) {
        configModule(key, null);
        this.report('message', 'config removed');
    } else if (arguments.length >= 2) {
        configModule(key, value);
        this.report('message', 'config saved');
    } else if (arguments.length === 1) {
        this.report('data', JSON.stringify(configModule(key), null, 2));
    } else {
        var flattened = flattenData(configModule());

        this.report('header', 'Configuration:');
        this.report('data', flattened);
    }
};

configTask.description = 'List, read and write configuration';