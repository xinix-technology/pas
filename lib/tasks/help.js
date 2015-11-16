// jshint esnext: true

const fs = require('fs-promise');
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
const doc = require('../doc');
const _ = require('lodash');

module.exports = (function() {
  'use strict';

  function *help(context) {
    var taskName = context._args[0];
    if (taskName) {
      yield doc(path.join(__dirname, '../../docs/tasks/' + taskName + '.md'));
    } else {
      console.log('%s %s - %s (node %s)',
        'pas'.green.bold,
        context.config('version').yellow.bold,
        'package automation tools'.rainbow,
        process.version);

      console.log('');
      console.log('Usage'.blue);
      console.log('  pas <task> [<options..>] [<args..>]');
      console.log('');

      console.log('Global tasks'.blue);

      var contextualTasks = _.chain(yield fs.readdir(path.join(__dirname)))
        .reduce(function(result, taskFile) {
          var name = path.basename(taskFile, '.js');
          var task = require('./' + name);
          if (typeof task.cycleIndex !== 'undefined') {
            result.push({
              index: task.cycleIndex || 0,
              args: ['%\'.-30s %s', name.yellow, (task.description || '(no description)')],
            });
          } else {
            console.log(sprintf('%\'.-30s %s', name.yellow, (task.description || '(no description)')));
          }
          return result;
        }, [])
        .sortBy('index').value();

      console.log('\nLifecycle tasks'.blue);
      _.forEach(contextualTasks, function(o) {
        console.log(sprintf.apply(null, o.args));
      });

      console.log('');
    }
  }

  help.description = 'Print help';

  return help;
})();

