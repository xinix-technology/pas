// jshint esnext:true

module.exports = (function() {
  'use strict';

  function clean(context) {
    var flow = context.manifest('tasks').clean;
    return context.flow('clean', flow);
  }

  clean.contextRequired = true;
  clean.description = 'Clean built pack';
  clean.cycleIndex = 0;

  return clean;
})();