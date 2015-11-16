// jshint esnext:true
const sprintf = require('sprintf-js').sprintf;
const HaltError = require('../errors/halt');

module.exports = (function() {
  'use strict';

  function *config(context) {
    var key;
    var conf = context._config;

    switch(context.args().length) {
      case 0:

        console.log('Configuration:'.blue);
        for(var i in conf) {
          if ('function' === typeof conf[i]) continue;
          console.log(sprintf('%\'.-40s %s', i.yellow, JSON.stringify(conf[i])));
        }
        break;
      case 1:
        if (context.opt('r') || context.opt('remove')) {
          key = context.arg(0);
          delete conf[key];
          conf.save();
          console.log('%s removed', key.yellow);
        } else {
          var val = conf[context.arg(0)];
          var type = typeof val;
          console.log('%s %s', type.yellow, JSON.stringify(val, null, 2));
        }
        break;
      case 2:
        key = context.arg(0);
        var value = context.arg(1);
        try {
          value = JSON.parse(value);
        } catch(e) {
        }
        conf[key] = value;
        yield conf.save();
        console.log('%s=%s'.yellow, key, JSON.stringify(value).white);
        break;
      default:
        throw new HaltError('Invalid arguments');
    }
  }

  config.description = 'List, read and write configuration';


  return config;
})();