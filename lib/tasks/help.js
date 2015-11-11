// jshint esnext: true

const fs = require('fs');
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
const doc = require('../doc');

module.exports = (function() {
  'use strict';

  function help(bundle) {
    var taskName = bundle.args()[0];
    if (taskName) {
      doc(path.join(__dirname, '../../docs/tasks/help.md'));
    } else {
      console.log('%s %s - %s', 'pas'.green.bold, bundle.appManifest.version.yellow.bold, 'package automation tools'.rainbow);

      console.log('');
      console.log('Usage'.blue);
      console.log('  pas <task> [<options..>] [<args..>]');
      console.log('');

      console.log('Global tasks'.blue);

      fs.readdirSync(path.join(__dirname)).forEach(function(taskFile) {
        var name = path.basename(taskFile, '.js');
        var task = require('./' + name);
        console.log(sprintf('%\'.-20s %\'.-50s'.grey, name.yellow, (task.description || '(no description)').white));
      });
    }
  }

  help.description = 'Print help';

  return help;
})();

