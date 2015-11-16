// jshint esnext:true

const HaltError = require('../errors/halt');

module.exports = (function() {
  'use strict';

  function *upgrade() {
    throw new HaltError('Unimplemented yet');
  }

  upgrade.description = '-';

  return upgrade;
})();