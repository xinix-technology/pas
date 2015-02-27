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

    var exists = fs.existsSync(src);
    // var stats = exists && fs.statSync(src);
    // var isDirectory = exists && stats.isDirectory();
    // if (exists && isDirectory) {
    if (exists) {
        fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(function(childItemName) {
            cp(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    // } else {
    //     fs.linkSync(src, dest);
    }
};

// var rmdir = function(dir) {
//     'use strict';

//     var list = fs.readdirSync(dir);
//     for(var i = 0; i < list.length; i++) {
//         var filename = path.join(dir, list[i]);
//         var stat = fs.lstatSync(filename);

//         if(filename == '.' || filename == '..') {
//             // pass these files
//         } else if(stat.isDirectory()) {
//             rmdir(filename);
//         } else {
//             fs.unlinkSync(filename);
//         }
//     }
//     fs.rmdirSync(dir);
// };

module.exports = {
    mkdirp: mkdirp,
    cp: cp,
    // rmdir: rmdir,
    rm: rimraf.sync
};