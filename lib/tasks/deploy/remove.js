var query = require('../../query');

var deployRemoveTask = module.exports = function(name) {
    'use strict';

    if (!name) {
        throw new Error('Usage: pas deploy:remove NAME');
    }

    return query().then(function(p) {
        var manifest = p.readManifest();
        manifest.deploy = manifest.deploy || {};
        delete manifest.deploy[name];
        p.writeManifest(manifest);
    });
};