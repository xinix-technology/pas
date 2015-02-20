var queryCache = {};

var Query = function(url) {
    'use strict';

    var splitted = url.split('#');

    this.query = url;
    this.name = splitted[0];
    this.version = splitted[1] || '';

    splitted = splitted[0].split('/');

    this.vendor = splitted[0];
    this.unit = splitted[1];
};

var query = function(url) {
    'use strict';

    if (!queryCache[url]) {
        queryCache[url] = new Query(url);
    }

    return queryCache[url];
};

module.exports = query;
