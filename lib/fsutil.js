var fs = require('fs'),
    rimraf = require('rimraf'),
    path = require('path');

var mkdirp = function(dir) {
    'use strict';

    if (!fs.existsSync(dir)) {
        var s = '/';
        dir.split(path.sep).forEach(function(p) {
            p = path.join(s, p);

            if (!fs.existsSync(p)) {
                fs.mkdirSync(p);
            }
            s = p;
        });
    }
};

var cp = function(src, dest) {
    'use strict';

    return new Promise(function(resolve, reject) {
        var exists = fs.existsSync(src);
        var stats = exists && fs.statSync(src);
        var isDirectory = exists && stats.isDirectory();
        // if (exists && isDirectory) {
        if (exists) {
            if (isDirectory) {
                var promises = [];

                fs.mkdirSync(dest);

                fs.readdirSync(src).forEach(function(childItemName) {
                    promises.push(cp(
                        path.join(src, childItemName),
                        path.join(dest, childItemName)
                    ));
                });

                return Promise.all(promises);
            } else {
                var destS = fs.createWriteStream(dest);
                fs.createReadStream(src).pipe(destS);

                destS.on('finish', function() {
                    resolve();
                });

                destS.on('error', function(err) {
                    reject(err);
                });
            }
        }
    });
};

module.exports = {
    mkdirp: mkdirp,
    cp: cp,
    rm: rimraf.sync
};