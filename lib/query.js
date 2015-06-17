// var provider = require('./provider'),
//     semver = require('semver'),
//     path = require('path'),
//     config = require('./config')(),
//     url = require('url'),
//     profile = require('./profile'),
//     fs = require('fs');

// var queryCache = {};

// var Query = function(queryUrl) {
//     'use strict';

//     Object.defineProperties(this, {
//         url: {
//             enumerable: true,
//             writable: true,
//             configurable: false,
//             value: queryUrl || ''
//         },
//         query: {
//             enumerable: true,
//             writable: true,
//             configurable: false,
//             value: queryUrl || ''
//         },
//         name: {
//             enumerable: true,
//             writable: true,
//             configurable: false
//         },
//         vendor: {
//             enumerable: true,
//             writable: true,
//             configurable: false
//         },
//         unit: {
//             enumerable: true,
//             writable: true,
//             configurable: false
//         },
//         version: {
//             enumerable: true,
//             writable: true,
//             configurable: false
//         },
//         // baseDir: {
//         //     enumerable: true,
//         //     writable: true,
//         //     configurable: false
//         // },
//         isWorkingPackage: {
//             enumerable: true,
//             writable: true,
//             configurable: false,
//             value: false
//         },
//         'package': {
//             enumerable: false,
//             writable: true,
//             configurable:false,
//         },
//         'indices': {
//             enumerable: false,
//             writable: true,
//             configurable:false,
//             value: {},
//         },
//         // profile: {
//         //     enumerable: true,
//         //     writable: true,
//         //     configurable: false
//         // },
//         // provider: {
//         //     enumerable: true,
//         //     writable: true,
//         //     configurable: false,
//         // },
//     });

//     if (!queryUrl) {
//         this.isWorkingPackage = true;

//         // read without merging manifest since while query all you need is just the name
//         var manifestFile = path.join(config.cwd, 'pas.json');
//         if (fs.existsSync(manifestFile)) {
//             var manifest = require(manifestFile);
//             this.url = 'local:' + manifest.name + '#master';
//         } else {
//             this.url = 'local:';
//         }
//     } else {
//         // noop
//     }

//     this.provider = provider.detect(this.url);

//     this.url = this.provider.normalizeUrl(this.url);

//     this.parseUrl_();
// };

// Query.prototype.parseUrl_ = function() {
//     'use strict';

//     var parsed = this.provider.parse(this.url);

//     this.name = parsed.name;
//     this.version = parsed.version;
//     this.vendor = parsed.vendor;
//     this.unit = parsed.unit;
// };

// Query.prototype.initialize = function() {
//     'use strict';

//     return this.isWorkingPackage ? Promise.resolve() : this.provider.getIndices(this.name, this.url)
//         .then(function(indices) {
//             if (indices) {
//                 this.indices = indices;
//             }
//         }.bind(this));
// };

// Query.prototype.get = function() {
//     'use strict';

//     var Package = require('./pkg');

//     return this.initialize()
//         .then(function() {
//             var validVersion;

//             if (this.isWorkingPackage && this.version === 'master') {
//                 validVersion = this.version;
//             } else if (semver.validRange(this.version)) {
//                 var versions = Object.keys(this.indices.releases || {});

//                 validVersion = semver.maxSatisfying(versions, this.version);
//                 if (!validVersion) {
//                     validVersion = 'master';
//                 }
//             } else if (this.indices.devs[this.version]) {
//                 validVersion = this.version;
//             } else {
//                 throw new Error('Bad version "' + this.url + '" version "' + this.version + '"');
//             }

//             if (!this.package) {
//                 this.package = new Package(this, validVersion);
//                 return this.package.initialize();
//             } else {
//                 return Promise.resolve(this.package);
//             }

//         }.bind(this));
// };

// var query = module.exports = function(queryUrl) {
//     'use strict';

//     var q;

//     if (!queryUrl) {
//         q = new Query();
//     } else if (!queryCache[queryUrl]) {
//         q = queryCache[queryUrl] = new Query(queryUrl);
//     }

//     return q.get();
// };
