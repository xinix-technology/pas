// jshint esnext: true
const _ = require('lodash');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const HaltError = require('./errors/halt');

module.exports = (function() {
  'use strict';

  function runString(options) {
    return new Promise(function(resolve, reject) {
      var logger = options.logger;
      var definition = options.definition;
      var opts = options.opts || {};

      exec(definition, opts, function(err, data) {
        if (err) {
          // console.error(err.stack);
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
    var definitionType = typeof definition.cmd;
    var opts = _.clone(definition);
    opts.env = _.defaults(opts.env, process.env);

    if (Array.isArray(definition.cmd)) {
      return runArray({
        definition: definition.cmd,
        logger: logger,
        opts: opts,
      });
    } else if (definitionType === 'string') {
      return runString({
        definition: definition.cmd,
        logger: logger,
        opts: opts,
      });
    } else {
      throw new HaltError('Unknown cmd, ' + definition);
    }
  }

  function runArray(options) {
    return new Promise(function(resolve, reject) {
      var logger = options.logger;
      var definition = options.definition;
      var opts = options.opts || {};
      if (opts.stdio && Array.isArray(opts.stdio)) {
        opts.stdio = _.map(opts.stdio, function(stream) {
            switch (stream) {
              case 'in':
                stream = process.stdin;
                break;
              case 'out':
                stream = process.stdout;
                break;
              case 'err':
                stream = process.stderr;
                break;
            }
            return stream;
        });
      }
      var c = spawn(definition[0], definition.slice(1), opts);
      if (logger) {
        if (c.stdout) {
          var outBuffer = [];
          c.stdout.on('data', function(data) {
            data.forEach(function(ch) {
              if (ch === 10) {
                logger({message: new Buffer(outBuffer).toString()});
                outBuffer = [];
              } else if (ch === 13) {
              } else {
                outBuffer.push(ch);
              }
            });
          });
        }

        if (c.stderr) {
          var errBuffer = [];
          c.stderr.on('data', function(data) {
            data.forEach(function(ch) {
              if (ch === 10) {
                logger({level:'error', message: new Buffer(errBuffer).toString()});
                errBuffer = [];
              } else if (ch === 13) {
              } else {
                errBuffer.push(ch);
              }
            });
          });
        }
      }

      c.on('close', function(code) {
        if (code === 0) {
          resolve();
        } else {
          reject(new HaltError('Caught error on spawning process'));
        }
      });
    });
  }

  function task(name, definition) {
    const series = require('./flow/series');
    const parallel = require('./flow/parallel');

    var definitionType = typeof definition;
    var t;
    if ('function' === definitionType) {
      t = function(logger) {
        var loggerWrap = (data) => {
          data.$name = name;
          return logger(data);
        };
        return definition(loggerWrap);
      };
    } else if (definition.type === 'series') {
      t = function(logger) {
        return series(name, definition.cmd).run(logger);
      };
    } else if (definition.type === 'parallel') {
      t = function(logger) {
        return parallel(name, definition.cmd).run(logger);
      };
    } else {
      t = function(logger) {
        var loggerWrap = (data) => {
          data.$name = name;
          return logger(data);
        };
        var run;
        if (definitionType === 'object') {
          if (Array.isArray(definition)) {
            run = runArray;
          } else {
            run = runObject;
          }
        } else if (definitionType === 'string') {
          run = runString;
        } else {
          throw new Error('Unimplemented definition type ' + definitionType);
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
