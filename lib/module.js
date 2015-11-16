//jshint esnext:true
const parallel = require('./flow/parallel');
const _ = require('lodash');

module.exports = (function() {
  'use strict';

  function Repository(context) {
    if (!(this instanceof Repository)) {
      return new Repository(context);
    }

    this.context = context;
    this.paths = context.manifest('modules');
  }

  Repository.prototype = {
    logger(data) {
      var overridenData;
      try {
        overridenData = JSON.parse(data.message);
        overridenData.$name = data.$name + '/' + (overridenData.$name || '-');
      } catch(e) {
        overridenData = data;
      }
      return this.context.logger.call(this.context, overridenData);
    },

    run(id) {
      if (this.paths) {
        var flow = _.map(this.paths, function(path) {
          return {
            cwd: path,
            env: {
              PAS_JSON: true
            },
            cmd: [process.argv[1], id]
          };
        });

        return parallel('m', flow).run(this.logger.bind(this));
      }

      return {};
    }
  };

  return Repository;
})();