// jshint esnext: true
const _ = require('lodash');
const co = require('co');
const task = require('../task');

module.exports = (function() {
  'use strict';

  function Series(definitions) {
    if (!(this instanceof Series)) {
      return new Series(definitions);
    }

    this.tasks = _.map(definitions, function(definition, name) {
      return task(name, definition);
    });
  }

  Series.prototype = {
    run(logger) {
      return co(function*() {
        for (var i in this.tasks) {
          logger({message: 'Run series ...'});
          var result = this.tasks[i](logger);
          if (result && ('object' === typeof result || 'function' === typeof result)) {
            result = yield result;
          }
        }
      }.bind(this));
    }
  };

  return Series;
})();