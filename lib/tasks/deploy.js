var task = require('../task'),
    deploy = require('../deploy'),
    query = require('../query');

var deployTask = module.exports = function(name) {
    'use strict';

    var deployTo = function(deployUrl) {
        var deployer = deploy.detect(deployUrl);

        return Promise.resolve(deployer.deploy(deployUrl));
    };

    return query().then(function(p) {
        if (!name) {
            var promises = [];
            for(var i in p.deploy) {
                promises.push(deployTo(p.deploy[i]));
            }
            return Promise.all(promises);
        } else if (p.deploy[name]) {
            return deployTo(p.deploy[name]);
        } else {
            return deployTo(name);
        }
    });
};