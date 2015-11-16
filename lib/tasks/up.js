// jshint esnext:true

module.exports = (function() {
  'use strict';

  function up(context) {
    var flow = context.manifest('tasks').up;
    return context.flow('up', flow);
  }

  up.contextRequired = true;
  up.description = 'Up pack at local';
  up.cycleIndex = 3;

  return up;
})();