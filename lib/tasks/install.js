// jshint esnext:true

module.exports = (function() {
  'use strict';

  function install(context) {
    var flow = context.manifest('tasks').install;
    return context.flow('install', flow);
  }

  install.contextRequired = true;
  install.description = 'Install pack to use';
  install.cycleIndex = 1;

  return install;
})();