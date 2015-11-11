// jshint esnext: true
const _ = require('lodash');
const co = require('co');
const task = require('../task');

module.exports = (function() {
  'use strict';

  function Parallel(definitions) {
    if (!(this instanceof Parallel)) {
      return new Parallel(definitions);
    }

    this.tasks = _.map(definitions, function(definition, name) {
      return task(name, definition);
    });
  }

  Parallel.prototype = {
    run(logger) {
      return co(function*() {
        logger({message: 'Run parallel ...'});
        return yield _.map(this.tasks, function(task) {
          return task(logger);
        });
      }.bind(this));
    }
  };

  return Parallel;
})();