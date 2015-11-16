// jshint esnext: true
const marked = require('marked');
const fs = require('fs-promise');
const sprintf = require('sprintf-js').sprintf;
const HaltError = require('./errors/halt');
const co = require('co');
const _ = require('lodash');

module.exports = (function() {
  'use strict';

  function unescape(html) {
    return html.replace(/&([#\w]+);/g, function(_, n) {
      n = n.toLowerCase();
      switch(n) {
        case 'colon': return ':';
        case 'amp': return '&';
        case 'lt': return '<';
        case 'gt': return '>';
        case 'quot': return '"';
        default:
          if (n.charAt(0) === '#') {
            return n.charAt(1) === 'x' ?
              String.fromCharCode(parseInt(n.substring(2), 16)) :
              String.fromCharCode(+n.substring(1));
          }
          return '';
      }
    });
  }

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
    return unescape(text).yellow;
  };

  renderer.paragraph = function(text) {
    return unescape(text) + '\n\n';
  };

  renderer.list = function(body, ordered) {
    return unescape(body).split('|||').map(function(line, i) {
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
    return unescape(text) + '|||';
  };

  renderer.blockquote = function(quote) {
    return _.map(quote.trim().split('\n'), function(quote) {
      return '| ' + unescape(quote.trim());
    }).join('\n') + '\n';
  };

  function doc(file) {
    return co(function *() {
      try {
        var content = yield fs.readFile(file, 'utf8');
        console.log(marked(content, { renderer: renderer }));
      } catch(e) {
        throw new HaltError('Missing documentation or documentation error');
      }
    });
  }

  return doc;
})();