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

  renderer.html = function() {
    console.log(arguments);
  };

  renderer.codespan = function(text) {
    return text.yellow;
  };

  renderer.paragraph = function(text) {
    return text + '\n\n';
  };

  renderer.list = function(body, ordered) {
    return body.split('|||').map(function(line, i) {
      if (!line) {
        return;
      }
      if (ordered) {
        return sprintf('%2d %s', i, line);
      }
      return sprintf('%s %s', '-', line);
    }).join('\n') + '\n';
  };

  renderer.listitem = function(text) {
    return text + '|||';
  };

  renderer.blockquote = function(quote) {
    return '| ' + quote + '\n';
  };

  return function(file) {
    try {
      var content = fs.readFileSync(file, 'utf8');
      console.log(marked(content, { renderer: renderer }));
    } catch(e) {
      throw new Error('Missing documentation or documentation error');
    }
  };
})();