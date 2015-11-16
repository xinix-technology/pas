// jshint esnext: true
const _ = require('lodash');
const co = require('co');
const task = require('../task');

module.exports = (function() {
  'use strict';

  function Series(name, definitions) {
    if (!(this instanceof Series)) {
      return new Series(name, definitions);
    }

    this.name = name;

    this.tasks = _.map(definitions, function(definition, name) {
      return task(this.name + '/' + name, definition);
    }.bind(this));
  }

  Series.prototype = {
    run(logger) {
      return co(function*() {
        logger({$name: this.name, message: 'Running series...'});
        for (var i in this.tasks) {
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