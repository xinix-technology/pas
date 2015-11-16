// jshint esnext:true

module.exports = (function() {
  'use strict';

  function test(context) {
    var flow = context.manifest('tasks').test;
    return context.flow('test', flow);
  }

  test.contextRequired = true;
  test.description = 'Test pack before use';
  test.cycleIndex = 2;

  return test;
})();