var query = require('../query'),
    profile = require('../profile');

var moduleTask = module.exports = function() {
    return query().then(function(p) {
        this.report('header', 'Modules:');

        var data = [];

        p.modules.forEach(function(dir) {
            var pr = profile.detect(dir);
            var row = {
                dir: dir,
                profile: '(' + pr.name + ')'
            };
            data.push(row);
        });

        if (data.length) {
            this.report('data', data);
        } else {
            this.report('empty', '-');
        }
    }.bind(this));
};