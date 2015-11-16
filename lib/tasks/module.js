// jshint esnext:true

const _ = require('lodash');

module.exports = (function() {
  'use strict';

  function module(context) {
    console.log('Modules'.blue);
    var modules = context.manifest('modules');
    if (modules) {
      _.forEach(modules, function(module) {
        console.log(module);
      });
    } else {
      console.log('(none)');
    }
    console.log('');
  }

  module.contextRequired = true;
  module.description = '-';

  return module;
})();