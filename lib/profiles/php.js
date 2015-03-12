var path = require('path'),
    fs = require('fs'),
    config = require('../config')();

var classmapCollectClasses = function(baseDir, classF) {
    'use strict';

    var classes = {};

    var trueClassF = path.join(baseDir, classF);
    if (fs.statSync(trueClassF).isDirectory()) {
        fs.readdirSync(trueClassF).forEach(function(f) {
            var relF = path.join(classF, f);
            var result = classmapCollectClasses(baseDir, relF);
            for(var i in result) {
                classes[i] = result[i];
            }
        }.bind(this));
    } else {
        var codeFile = fs.readFileSync(path.join(baseDir, classF), 'utf8');
        var className = codeFile.match(/class\s+([^\s]+)/);
        if (!className || !className[1]) {
            return {};
        }
        className = className[1];

        var ns = codeFile.match(/namespace\s+(.*);/);
        if (!ns || !ns[1]) {
            return {};
        }
        ns = ns[1];

        classes[ns + '\\' +  className] = classF;
    }

    return classes;
};

var phpProfile = module.exports = {
    vendorDirectory: 'vendor'
};

phpProfile.support = function(baseDir) {
    'use strict';

    return fs.existsSync(path.join(baseDir, 'composer.json'));
};

phpProfile.readManifest = function(baseDir) {
    'use strict';

    var provider = require('../provider');

    if (this.hasManifest(baseDir)) {
        return this.super_.readManifest.call(this, baseDir);
    } else {
        var manifestPromise = this.super_.readManifest.call(this, baseDir);

        var composerManifest,
            composerFile = path.join(baseDir, 'composer.json'),
            dependencies = {},
            autoloads = {
                files: []
            };

        var promise;
        if (fs.existsSync(composerFile)) {
            composerManifest = require(composerFile);

            var promises = [];
            var repositoryMap = {};

            if (composerManifest.repositories) {
                composerManifest.repositories.forEach(function(repo) {
                    var repoProvider = provider.detect(repo.url);

                    var innerPromise = repoProvider.runScope(repo.url, function(scope) {
                        return require('../profile').detect(scope.directory).readManifest(scope.directory)
                            .then(function(repoManifest) {
                                repositoryMap[repoManifest.name] = scope.url;
                            });
                    });

                    promises.push(innerPromise);

                });
            }

            promise = Promise.all(promises);
        } else {
            promise = Promise.resolve();
        }

        return promise
            .then(function() {
                var requires = composerManifest.require || {};
                for(var i in requires) {
                    var version = requires[i].indexOf('dev-') === 0 ? requires[i].substr(4) : requires[i];
                    // FIXME ugly hack to ignore non vendor-unit deps
                    if (i.indexOf('/') < 0) {
                        continue;
                    }
                    if (repositoryMap[i]) {
                        dependencies[i] = repositoryMap[i] + '#' + i + '@' + version;
                    } else {
                        dependencies[i] = 'packagist:' + i + '#' + version;
                    }
                }

                if (composerManifest.autoload) {
                    Object.keys(composerManifest.autoload).forEach(function(i) {

                        var j,
                            key;
                        if (i === 'psr-0') {
                            var psr0 = composerManifest.autoload[i];
                            for(j in psr0) {
                                key = j.replace(/^[\\]+/, '').replace(/[\\]+$/, '');
                                autoloads[key] = path.join(psr0[j] || '', j.replace(/\\/g, '/')).replace(/[\/]+$/, '');
                            }
                        } else if (i === 'psr-4') {
                            var psr4 = composerManifest.autoload[i];
                            for(j in psr4) {
                                key = j.replace(/^[\\]+/, '').replace(/[\\]+$/, '');
                                autoloads[key] = psr4[j].replace(/[\/]+$/, '');
                            }
                        } else if (i === 'classmap') {
                            var classmap = composerManifest.autoload[i];

                            for(j in classmap) {
                                var classes = classmapCollectClasses(baseDir, classmap[j]);
                                for(var k in classes) {
                                    autoloads[k] = classes[k];
                                }
                            }
                        } else if (i === 'files') {
                            // autoloads.files = autoloads.files || [];
                            composerManifest.autoload[i].forEach(function(file) {
                                autoloads.files.push(file);
                            }.bind(this));
                        } else {
                            throw new Error('unimplement yet for autoload:' + i);
                        }
                    });
                }

                return manifestPromise;
            }.bind(this))
            .then(function(manifest) {
                manifest.profile = 'php';
                manifest.name = composerManifest.name;
                manifest.dependencies = dependencies;
                manifest.autoload = autoloads;

                return manifest;
            });
    }
};


phpProfile.preInstall = function(p) {
    'use strict';

    p.dependencies['xinix-technology/pas-php'] = '';
};

phpProfile.postInstall = function(p) {
    'use strict';

    for(var i in p.autoload) {
        if (i === 'files') {

        } else {
            var autoloadFile = path.join(config.cwd, 'autoload.json');
            var autoload = {};
            try {
                autoload = JSON.parse(fs.readFileSync(autoloadFile, {encoding:'utf8'}));
            } catch(e) {}
            if (p.isWorkingPackage) {
                autoload[i] = p.autoload[i];
            } else {
                autoload[i] = path.join(this.vendorDirectory, p.name, p.autoload[i]);
            }
            fs.writeFileSync(autoloadFile, JSON.stringify(autoload, null, 2), {encoding:'utf8'});
        }
    }

    var autoloadF = path.join(config.cwd, this.vendorDirectory, 'autoload.php');
    fs.writeFileSync(autoloadF, "<?php\n\nrequire '../vendor/xinix-technology/pas-php/src/autoload.php';\n");
};
