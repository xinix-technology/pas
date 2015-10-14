describe('util/string', function() {
  'use strict';

  var stringUtil = require('../../lib/util/string');

  // describe('#deltaT', function() {
  //   it('should return elapsed time', function() {
  //     expect(typeof stringUtil.deltaT()).toEqual('number');
  //   })
  // });

  describe('#pad()', function() {
    it('should add 2 chars padding after string', function() {
      expect(stringUtil.pad('1', 3)).toEqual('1  ');
    });

    it('should add 2 chars padding before string', function() {
      expect(stringUtil.pad('1', 3, 'right')).toEqual('  1');
    });

    it('should truncate string', function() {
      expect(stringUtil.pad('123456', 3)).toEqual('123');
    });
  });
});
