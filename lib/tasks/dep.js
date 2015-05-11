var query = require('../query'),
    config = require('../config')(),
    path = require('path'),
    fs = require('fs');

var depsTask = {
    description: 'Show dependencies for current directory',

    exec: function() {
        'use strict';

        var dependencies = [];

        throw new Error('This task appear to be removed task');

        // var profileManifests = query.profile.getBaseManifest().profiles;
        // query.profile.getSupportedProfileNames().forEach(function(profileName) {
        //     var vendorDir = path.join(config.cwd, profileManifests[profileName].vendorDirectory);
        //     var vendors = fs.readdirSync(vendorDir);
        //     vendors.forEach(function(vendor) {
        //         if (!fs.statSync(path.join(vendorDir, vendor)).isDirectory())  {
        //             return;
        //         }

        //         var unitDir = path.join(vendorDir, vendor);
        //         var units = fs.readdirSync(unitDir);
        //         units.forEach(function(unit) {
        //             var meta = fs.realpathSync(path.join(unitDir, unit)).split('/').slice(-4);

        //             var dep = {
        //                 '': '  ',
        //                 name: vendor + '/' + unit,
        //                 version: meta[3],
        //                 provider: meta[0],
        //             };

        //             dependencies.push(dep);
        //         });
        //     });

        //     this.report('header', 'Profile %s', profileName);
        //     this.report('data', dependencies);
        // }.bind(this));

    }
};

module.exports = depsTask;