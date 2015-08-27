var delegates = require('delegates');

module.exports = function() {
    'use strict';

    var proto = {};

    delegates(proto, 'app')
        .method('require')
        .method('config')
        .method('task')
        .method('query')
        .method('i')
        .method('e')
        .access('cwd')
        .access('env')
        .access('debug')
        .access('packs')
        .access('plugins')
        .access('providers')
        .access('deployers')
        .access('profiles');

    return proto;
};
