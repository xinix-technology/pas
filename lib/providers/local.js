var url = require('url');

var localProvider = {
    support: function(packageUrl) {
        'use strict';

        if (packageUrl.indexOf('local:') === 0) {
            return true;
        }
    },

    parse: function(packageUrl) {
        'use strict';

        var parsed = url.parse(packageUrl);

        var c = {
            url: packageUrl,
            name: parsed.hostname + parsed.pathname,
            version: parsed.hash ? parsed.hash.substr(1) : '',
            vendor: parsed.hostname,
            unit: parsed.pathname ? parsed.pathname.substr(1) : '',
        };
        return c;
    },

    fetchIndices: function(vendor, unit) {
        'use strict';

        return {
            devs: {
                master: {
                    name: 'master',
                    type: 'dev'
                }
            }
        };
    },

    normalizeUrl: function(packageUrl) {
        'use strict';

        if (packageUrl.indexOf('local:') === 0) {
            return packageUrl;
        }

        return 'local:' + packageUrl;
    }
};

module.exports = localProvider;