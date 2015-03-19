var query = require('../../query');

var deployAddTask = module.exports = function(name, url) {
    'use strict';

    if (!name || !url) {
        throw new Error('Usage: pas deploy:add NAME URL');
    }

    return query().then(function(p) {
        var manifest = p.readManifest();
        manifest.deploy = manifest.deploy || {};
        manifest.deploy[name] = url;
        p.writeManifest(manifest);
    });
};