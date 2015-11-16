// jshint esnext: true

const url = require('url');
const GitHubApi = require('github');
const fs = require('fs-promise');
const path = require('path');
const semver = require('semver');
const _ = require('lodash');
const tmp = require('tmp');
const request = require('superagent');
const zlib = require('zlib');
const tar = require('tar');

tmp.setGracefulCleanup();

module.exports = (function() {
  'use strict';

  return function(context) {
    var github = new GitHubApi({
      version: '3.0.0',
      headers: {
        'user-agent': 'Pas-Package-Management'
      }
    });

    github.getTags = function(params) {
      return new Promise(function(resolve, reject) {
        github.repos.getTags(params, function(err, data) {
          if (err) return reject(err);
          resolve(data);
        });
      });
    };
    github.getBranches = function(params) {
      return new Promise(function(resolve, reject) {
        github.repos.getBranches(params, function(err, data) {
          if (err) return reject(err);
          resolve(data);
        });
      });
    };

    var token = context.config('provider.github.token');
    if (token) {
      github.authenticate({
        type: 'oauth',
        token: token
      });
    }

    return {
      parse(source) {
        var parsed = url.parse(source);
        if (!parsed.protocol) {
          var splitted = parsed.pathname.split('/');
          return {
            vendor: splitted[0],
            unit: splitted[1],
            version: parsed.hash ? decodeURIComponent(parsed.hash).slice(1) : 'master',
          };
        }
      },

      *getIndex(params) {
        var indexFile = path.join(context.config('home'), 'providers/github', params.user, params.repo, 'index.json');

        var index;
        try {
          index = JSON.parse(yield fs.readFile(indexFile));

          var expireAt = new Date(index.fetchedAt).getTime() + context.config('provider.github.indexCache');
          var now = new Date().getTime();
          if (expireAt >= now) {
            throw new Error('Expiring');
          }
        } catch(e) {
          yield fs.ensureDir(path.dirname(indexFile));

          index = yield {
            tags: github.getTags(params),
            branches: github.getBranches(params),
            fetchedAt: new Date().toISOString(),
          };

          index.tags = _.reduce(index.tags, function(result, value, key) {
            result[value.name] = value;
            return result;
          }, {});
          index.branches = _.reduce(index.branches, function(result, value, key) {
            result[value.name] = value;
            return result;
          }, {});

          yield fs.writeFile(indexFile, JSON.stringify(index, null, 2));
        }

        return index;
      },

      *resolve(source) {
        var parsed = this.parse(source);
        var params = {
          user: parsed.vendor,
          repo: parsed.unit
        };

        var version = parsed.version;
        var index = yield this.getIndex(params);
        if (semver.validRange(parsed.version)) {
          var tags = Object.keys(index.tags);
          var satisfied = semver.maxSatisfying(tags, parsed.version);
          if (satisfied) {
            parsed.version = satisfied;
            parsed.commit = index.tags[satisfied].commit.sha;
          }
        } else if (index.branches[parsed.version]) {
          parsed.commit = index.branches[parsed.version].commit.sha;
        }

        if (!parsed.commit) {
          throw new Error('Unresolved pack: ' + source);
        }

        parsed.cache = path.join(context.config('home'), 'providers/github', params.user, params.repo, parsed.commit);
        return parsed;
      },

      *fetch(source) {
        var parsed = yield this.resolve(source);
        var params = {
          user: parsed.vendor,
          repo: parsed.unit
        };

        var cachePath = parsed.cache;

        try {
          var cacheStat = yield fs.stat(cachePath);
          if (!cacheStat.isDirectory()) {
            throw Error('Cache path is not dir');
          }
          return parsed;
        } catch(e) {}

        var commitUrl = 'https://api.github.com/repos/' + parsed.vendor + '/' + parsed.unit + '/tarball/' + parsed.commit;

        var tmpFile = yield new Promise(function(resolve, reject) {
          tmp.file({ postfix: '.tar.gz' }, function(err, data) {
            if (err) return reject(err);
            resolve(data);
          });
        });

        yield new Promise(function(resolve, reject) {
          var tmpStream = fs.createWriteStream(tmpFile).on('error', reject);
          request
            .get(commitUrl)
            .set(github.config.headers)
            .end(function(err, res){
              if (err) {
                reject(new Error(JSON.parse(res.body).message));
              }
              res.pipe(tmpStream).on('finish', resolve);
            });
        });

        yield fs.remove(cachePath);

        yield new Promise(function(resolve, reject) {
          var fis = fs.createReadStream(tmpFile),
            gzs = fis.pipe(zlib.createGunzip()),
            extractor = tar.Extract({
              path: cachePath,
              strip: 1
            }),
            ts = gzs.pipe(extractor);

          fis.on('error', reject);
          gzs.on('error', reject);
          ts.on('error', reject);

          extractor
            .on('error', reject)
            .on('end', function() {
              return resolve();
            });
        });
        return parsed;
      }
    };
  };
})();