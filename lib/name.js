var Name = function() {
    'use strict';
};

Name.prototype.query = function(name) {
    'use strict';

    var splittedName = name.split(':'),
        pkg = splittedName[0],
        version = splittedName[1] || '',
        splitted = pkg.split('/');

    return {
        'package': pkg,
        vendor: splitted[0],
        name: splitted[1],
        version: version
    };
};

// Name.prototype.resolve = function(name) {
//     'use strict';

//     var q = this.query(name);

//     var pkgDir = path.join(this.config('repository'), link);

//     if (!fs.existsSync(pkgDir)) {
//         throw new Error('Package not found.');
//         return;
//     }

//     versions = fs.readdirSync(pkgDir);
// };

module.exports = new Name();