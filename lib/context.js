// jshint esnext: true

const _ = require('lodash');
const parallel = require('./flow/parallel');
const co = require('co');
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
const HaltError = require('./errors/halt');
const provider = require('./provider');
const profile = require('./profile');

module.exports = (function() {
  'use strict';

  function Bundle(config) {
    if (!(this instanceof Bundle)) {
      return new Bundle(config);
    }

    this.startTime = new Date().getTime();

    this._config = config;

    this.providers = provider(this);
    this.profiles = profile(this);
  }

  Bundle.prototype = {
    elapsedTime() {
      return new Date().getTime() - this.startTime;
    },

    config(name, def) {
      if (arguments.length === 0) {
        return this._config;
      }
      return this._config[name] || def;
    },

    manifest(name, def) {
      if (arguments.length === 0) {
        return this._manifest;
      }
      return this._manifest[name] || def;
    },

    args(args) {
      if (0 === arguments.length) {
        return this._args;
      } else {
        this._args = args;
        return this;
      }
    },

    arg(args, def) {
      return this._args[args] || def;
    },

    opts(opts) {
      if (0 === arguments.length) {
        return this._opts;
      } else {
        this._opts = opts;
        return this;
      }
    },

    opt(opts) {
      return this._opts[opts] || undefined;
    },

    run(id) {
      if (this.config('debug')) {
        this.logger({message: 'Start running...'});
      }

      if (this.opt('h') || this.opt('help')) {
        if (id) {
          this._args.unshift(id);
        }
        id = 'help';
      } else {
        id = id || 'help';
      }

      var runPromise = co(function*() {
        var task;
        try {
          task = require('./tasks/' + (id || 'help'));
        } catch(e) {
        }
        if (task) {
          return yield this.runInternally(id, task);
        } else {
          yield this.loadManifest();
          return this.flow(id, this.manifest('tasks')[id]);
        }
      }.bind(this));

      if (this.config('debug')) {
        runPromise = runPromise.then(() => {
          this.logger({message:'Finished'});
        }, (err) => {
          this.logger({message:'Finished'});
          throw err;
        });
      }

      return runPromise;
    },

    flow(id, flow) {
      if (!flow) {
        console.error(sprintf('Flow "%s" not found'.red, id));
        return;
      }
      return parallel(id, flow).run(this.logger.bind(this));
    },

    logger(data) {
      if (this.config('json')) {
        if (level === 'error') {
          console.error(JSON.stringify(data));
        } else {
          console.log(JSON.stringify(data));
        }
        return;
      }

      var name = (typeof data.$name === 'undefined' || data.$name === null) ? '-' : data.$name;
      var level = data.level || 'info';
      var message = data.message;

      var placeholder;
      if (level === 'error') {
        placeholder = '%-15.15s | %s'.red;
        name = '*' + name;
      } else {
        name = '' + name;
        placeholder = '%-15.15s | %s'.green;
      }

      if (this.config('debug')) {
        placeholder = sprintf('%06.3f', this.elapsedTime() / 1000).yellow + ' ' + placeholder;
      }

      console.error(sprintf(placeholder, name, message.white));
    },

    *runInternally(id, task) {
      if (task.contextRequired) {
        yield this.loadManifest();
      }

      if (typeof task.cycleIndex !== 'undefined') {
        yield require('./module')(this).run(id);
      }

      return co.wrap(task)(this);
    },

    *loadManifest() {
      if (this._manifest) {
        return;
      }

      var p = yield this.profiles.detect();
      this.logger({message: sprintf('Using "%s" profile', p.name || 'unknown')});
      if (p) {
        this._manifest = yield p.manifest();
      }
    },

    halt(message) {
      throw new HaltError(message);
    },
  };

  return Bundle;
})();