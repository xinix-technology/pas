var url = require('url'),
    path = require('path'),
    config = require('../config')(),
    request = require('request');

var fileProvider = module.exports = {
    support: function(pack) {
        'use strict';

        var parsed = url.parse(pack.queryUrl);

        if (parsed.protocol === 'file:') {
            return true;
        }
    },

    fetch: function(pack) {
        'use strict';

        var cachePath;
        if (pack.queryUrl === 'file:') {
            cachePath = this.cwd;
            pack.working = true;
        }

        return cachePath;
    },

    // parse: function(queryUrl) {
    //     'use strict';

    //     var normalized = this.normalizeUrl(queryUrl);

    //     var parsed = url.parse(normalized);

    //     var name = 'undefined';
    //     var vendor = 'undefined';
    //     var unit = 'undefined';

    //     return {
    //         url: queryUrl,
    //         name: name,
    //         version: 'master',
    //         vendor: vendor,
    //         unit: unit,
    //     };
    // },

    // normalizeUrl: function(packageUrl) {
    //     'use strict';

    //     var parsed = url.parse(packageUrl);

    //     var pathname = parsed.pathname;
    //     if (pathname[0] !== '/') {
    //         pathname = path.join(config.cwd, pathname);
    //     }

    //     return 'file://' + pathname;
    // },

    // fetchIndices: function() {
    //     'use strict';

    //     return {
    //         devs: {
    //             master: {
    //                 name: 'master',
    //                 type: 'dev',
    //                 // url:
    //             }
    //         }
    //     };
    // },

    // pull: function() {
    //     'use strict';

    //     console.log(arguments);
    //     // throw new Error('Unimplemented yet, check later');
    // }
};