// jshint esnext: true

const provider = require('../provider');
const HaltError = require('../errors/halt');
const sprintf = require('sprintf-js').sprintf;

module.exports = (function() {
  'use strict';

  function *init(context) {
    if (context.args().length === 0) {
      throw new HaltError('Invalid arguments');
    }

    var manifestName = context.opt('n') || context.opt('name') || 'my/app';
    var manifestVersion = context.opt('v') || context.opt('version') || '0.0.1';
    var manifestProfile = context.opt('p') || context.opt('profile');

    // validate manifestName
    if (manifestName && manifestName.split('/').length !== 2) {
      manifestName = 'my/' + manifestName;
    }

    if (context.opts().length === 0) {
      throw new Error('Unimplemented yet');
    } else {
      var source = context.arg(0);
      var dest = context.arg(1, '.');

      var p = context.providers.detect(source);
      var meta = yield p.provide(source, dest);
      manifestVersion = meta.version;

      context.logger({message: sprintf('%s ver %s initialized', manifestName, manifestVersion)});
    }
  }

  init.description = 'Initialize new package for development';

  return init;
})();