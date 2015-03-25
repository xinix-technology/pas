var PolyfillPromise = require('promise');

if (global.Promise) {
    for(var i in PolyfillPromise) {
        if (!global.Promise[i]) {
            global.Promise[i] = PolyfillPromise[i];
        }
    }
} else {
    global.Promise = PolyfillPromise;
}