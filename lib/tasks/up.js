var query = require('../query'),
    task = require('../task');

module.exports = function() {
    return task.run('install', this.opts)
        .then(function() {
            return query();
        })
        .then(function(p) {
            return p.up(this.opts);
        }.bind(this));
};