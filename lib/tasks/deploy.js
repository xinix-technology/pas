// jshint esnext:true

module.exports = (function() {
  'use strict';

  function deploy(context) {
    var flow = context.manifest('tasks').deploy;
    return context.flow('deploy', flow);
  }

  deploy.contextRequired = true;
  deploy.description = 'Deploy pack to server';
  deploy.cycleIndex = 4;

  return deploy;
})();