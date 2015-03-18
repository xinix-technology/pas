var path = require('path'),
    semver = require('semver'),
    fs = require('fs'),
    url = require('url'),
    query = require('../query'),
    mkdirp = require('../fsutil').mkdirp;

var linkTask = module.exports = function(packageUrlOrObject) {
    'use strict';

    var pCurrent;

    if (arguments.length === 0) {
        return query()
            .then(function(pArg) {
                pCurrent = pArg;
                return pCurrent.createLink();
            })
            .then(function() {
                this.report('message', '%s#master linked', pCurrent.name);
            }.bind(this));
    } else {
        var p;
        return query()
            .then(function(pParam) {
                pCurrent = pParam;
                if (typeof packageUrlOrObject === 'object') {
                    p = packageUrlOrObject;
                } else {
                    var parsed = url.parse(packageUrlOrObject);
                    if (!parsed.protocol) {
                        packageUrlOrObject = 'local:' + packageUrlOrObject;
                    }

                    return query(packageUrlOrObject)
                        .then(function(pArg) {
                            p = pArg;
                        });
                }
            })
            .then(function() {
                this.report('rewrite', '[%s] linking %s', p.name, p.version);
                return pCurrent.link(p);
            }.bind(this))
            .then(function() {
                this.report('rewrite', '[%s] linked %s', p.name, p.version);
            }.bind(this));
    }
};

linkTask.description = 'Link local directory as repository package';
