// jshint esnext: true
const marked = require('marked');
const fs = require('fs');
const sprintf = require('sprintf-js').sprintf;


module.exports = (function() {
  'use strict';

  const renderer = new marked.Renderer();

  renderer.heading = function (text, level) {
    var x = '';
    for(var i = 0; i < level; i++) {
      x += '#';
    }
    return sprintf('%s %s\n\n'.blue, x, text);
  };

  renderer.code = function(text) {
    return text.split('\n').map(function(line) {
      return '| ' + line.yellow;
    }).join('\n') + '\n\n';
  };

  renderer.codespan = function(text) {
    return text.yellow;
  };

  renderer.paragraph = function(text) {
    return text + '\n\n';
  };

  return function(file) {
    try {
      var content = fs.readFileSync(file, 'utf8');
      console.log(marked(content, { renderer: renderer }));
    } catch(e) {
      console.log(e.stack);
      console.log('(no content)');
    }
  };
})();