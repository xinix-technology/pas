// jshint esnext: true
const _ = require('lodash');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

module.exports = (function() {
  'use strict';

  function runString(options) {
    return new Promise(function(resolve, reject) {
      var logger = options.logger;
      var definition = options.definition;
      var opts = options.opts || {};

      exec(definition, opts, function(err, data) {
        if (err) {
          return reject(new Error('Caught error on executing process'));
        }

        if (logger) {
          _.forEach(data.trim().split("\n"), function(line) {
            logger({message: line});
          });
        }
        resolve();
      });
    });
  }

  function runObject(options) {
    var definition = options.definition;
    var logger = options.logger;

    switch(typeof definition.cmd) {
      case 'string':
        return runString({
          definition: definition.cmd,
          logger: logger,
          opts: definition,
        });
      case 'object':
        if (Array.isArray(definition.cmd)) {
          return runArray({
            definition: definition.cmd,
            logger: logger,
            opts: definition,
          });
        }
      default:
        throw new Error('Unknown cmd, ', definition);
    }
  }

  function runArray(options) {
    return new Promise(function(resolve, reject) {
      var logger = options.logger;
      var definition = options.definition;
      var opts = options.opts || {};

      var c = spawn(definition[0], definition.slice(1), opts);

      if (logger) {
        var lastOut = '';
        c.stdout.on('data', function(data) {
          var lines = data.toString().split('\n');
          var lastLine = lines.pop();
          lines[0] = lastOut + lines[0];
          if (lastLine) {
            lastOut = lastLine;
          }
          _.forEach(lines, function(line) {
            logger({message: line});
          });
        });

        var lastErr = '';
        c.stderr.on('data', function(data) {
          var lines = data.toString().split('\n');
          var lastLine = lines.pop();
          lines[0] = lastErr + lines[0];
          if (lastLine) {
            lastErr = lastLine;
          }
          _.forEach(lines, function(line) {
            logger({level:'error', message: line});
          });
        });
      }

      c.on('close', function(code) {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Caught error on spawning process'));
        }
      });
    });
  }

  function task(name, definition) {
    const series = require('./flow/series');
    const parallel = require('./flow/parallel');
    var t;
    if (name === '$series') {
      t = function(logger) {
        return series(definition).run(logger);
      };
    } else if (name === '$parallel') {
      t = function(logger) {
        return parallel(definition).run(logger);
      };
    } else if ('function' === typeof definition) {
      t = definition;
    } else {
      t = function(logger) {
        var loggerWrap = (data) => {
          data.$name = name;
          return logger(data);
        };
        var run;
        switch(typeof definition) {
          case 'string':
            run = runString;
            break;
          case 'object':
            run = Array.isArray(definition) ? runArray : runObject;
            break;
          default:
            throw new Error('Unimplemented definition type ' + (typeof definition));
        }
        return run({
          definition: definition,
          logger: loggerWrap,
        });
      };
    }
    return t;
  }

  return task;
})();
