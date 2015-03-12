var url = require('url'),
    request = require('request');

var httpProvider = module.exports = {
    support: function(pUrl) {
        'use strict';

        var parsed = url.parse(pUrl);

        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return true;
        }
    },

    parse: function(queryUrl) {
        'use strict';

        throw new Error('revisit me');

        var parsed = url.parse(queryUrl);

        var name = (parsed.host || 'null') + '/' + (parsed.path || '').replace(/[:\/\\._?=&]/g, ' ').trim().replace(/\s/g, '-');
        var splitted = name.split('/');

        return {
            url: queryUrl,
            name: name,
            version: 'master',
            vendor: splitted[0],
            unit: splitted[1],
        };
    },

    normalizeUrl: function(packageUrl) {
        'use strict';

        return packageUrl;
    },

    fetchIndices: function() {
        'use strict';

        return {
            devs: {
                master: {
                    name: 'master',
                    type: 'dev',
                    // url:
                }
            }
        };
    },

    pull: function() {
        'use strict';

        throw new Error('Unimplemented yet, check later');
    }
};