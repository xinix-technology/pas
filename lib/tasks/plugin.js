// jshint esnext:true

const HaltError = require('../errors/halt');

module.exports = (function() {
  'use strict';

  function *plugin() {
    throw new HaltError('Unimplemented yet');
  }

  plugin.description = '-';

  return plugin;
})();