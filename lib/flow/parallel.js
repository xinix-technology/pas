// jshint esnext: true
const _ = require('lodash');
const co = require('co');
const task = require('../task');

module.exports = (function() {
  'use strict';

  function Parallel(name, definitions) {
    if (!(this instanceof Parallel)) {
      return new Parallel(name, definitions);
    }

    this.name = name;

    this.tasks = _.map(definitions, function(definition, name) {
      return task(this.name + '/' + name, definition);
    }.bind(this));
  }

  Parallel.prototype = {
    run(logger) {
      return co(function*() {
        logger({$name: this.name, message: 'Running parallel...'});
        return yield _.map(this.tasks, function(task) {
          return task(logger);
        });
      }.bind(this));
    }
  };

  return Parallel;
})();