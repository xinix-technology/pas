// jshint esnext: true

const _ = require('lodash');
const parallel = require('./flow/parallel');
const co = require('co');
const path = require('path');
const sprintf = require('sprintf-js').sprintf;

module.exports = (function() {
  'use strict';

  function Bundle(options) {
    if (!(this instanceof Bundle)) {
      return new Bundle(options);
    }

    this.options = options;

    this.appManifest = require(path.join(__dirname, '../package.json'));
  }

  Bundle.prototype = {
    args(args) {
      if (0 === arguments.length) {
        return this._args;
      }
      this._args = args;
      return this;
    },

    opts(opts) {
      if (0 === arguments.length) {
        return this._opts;
      }
      this._opts = opts;
      return this;
    },

    run(id) {
      id = id || 'help';

      return co(function*() {
        var task;
        try {
          task = require('./tasks/' + (id || 'help'));
        } catch(e) {
        }
        if (task) {
          return yield this.runInternally(task);
        } else {
          if (!this.options[id]) {
            throw new Error(sprintf('Flow "%s" not found', id));
          }
          return parallel(this.options[id]).run(this.logger);
        }
      }.bind(this));
    },

    logger(data) {
      var name = data.$name || '-';
      var level = data.level || 'info';
      var message = data.message;
      // var message = _.reduce(data, function(result, value, key) {
      //   if (key[0] !== '$') {
      //     result.push(key + '=' + value);
      //   }
      //   return result;
      // }, []).join("\n");
      if (level === 'error') {
        console.error(sprintf('%-15.15s | %s'.red, '*' + name, message.white));
      } else {
        console.log(sprintf('%-15.15s | %s'.green, name, message.white));
      }
    },

    runInternally(task) {
      return co.wrap(task)(this);
    }
  };

  return Bundle;
})();