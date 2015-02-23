var path = require('path'),
    fs = require('fs');

var PHP = function() {
    'use strict';
};

PHP.prototype.readManifest = function() {
    'use strict';
    var manifest;

    if (this.hasManifest()) {
        manifest = this.super_.readManifest.apply(this);
        return manifest;
    } else {
        manifest = this.super_.readManifest.apply(this);

        var composerManifest,
            composerFile = path.join(this.package.baseDir, 'composer.json'),
            dependencies = {};
        if (fs.existsSync(composerFile)) {
            composerManifest = require(composerFile);

            var requires = composerManifest.require || {};
            for(var i in requires) {
                var version = requires[i].indexOf('dev-') === 0 ? requires[i].substr(4) : requires[i];
                // FIXME ugly hack to ignore non vendor-unit deps
                if (i.indexOf('/') < 0) {
                    continue;
                }
                dependencies[i] = 'https://packagist.org/p/' + i + '#' + version;
            }
        }

        manifest.profile = 'php';
        manifest.name = this.package.name;
        manifest.version = this.package.version;
        manifest.dependencies = dependencies;

        return manifest;
    }
};

PHP.prototype.support = function(baseDir) {
    'use strict';
    return fs.existsSync(path.join(baseDir, 'composer.json'));
};

module.exports = new PHP();