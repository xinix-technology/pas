describe('config', function() {
  'use strict';

  var Config = require('../lib/config');

  describe('.all', function() {

    var all = Config.all(new Config());

    it('has pristine values', function() {
      expect(all.home).toBeTruthy();
    });

    it('has file extracted values', function() {
      expect(all['plugins.home']).toBeTruthy();
    });

  });
});
