/**
 * Firebase service.
 */

'use strict';

const request = require('request');

const TIMEOUT = 5000;
const baseRequest = request.defaults({timeout: TIMEOUT, json: true});
const VALID_ID = /^[-0-9a-zA-Z]{2,}$/;
const VALID_URL = /^https?:\/\/[\da-z\.-]+(\:\d+)?\/?$/;
const ERR_INVALID_ID = 'Invalid Firebase id.';
const ERR_NO_SECRET = 'A Firebase secret is required for this operation.';

class ResponseError extends Error {

  constructor(opts, resp, body) {
    super(resp.statusMessage);
    this.name = 'ResponseError';

    this.url = opts.url;
    this.method = opts.method;
    this.status = resp.statusCode;
    this.authDebug = resp.headers['x-firebase-auth-debug'];
    this.body = body;
  }
}

class Request {

  constructor(opts) {
    this.rootPath = trimPath(opts.rootPath);
    this.url = opts.url;
    this.auth = opts.auth;
    this.$logger = opts.logger || console;
  }

  toString() {
    return Request.fixUrl(this.url);
  }

  static fixUrl(url) {
    return url.endsWith('.json') ? url : `${url}.json`;
  }

  process(url, method, qs, payload) {
    return new Promise((resolve, reject) => {
      const opts = {
        url: Request.fixUrl(url),
        method: method,
        qs: Object.assign({auth: this.auth}, qs)
      };

      if (payload !== undefined) {
        opts.body = payload;
      }

      baseRequest(opts, (err, resp, body) => {
        if (err) {
          reject(err);
          return;
        }

        const debugMessage = resp.headers['x-firebase-auth-debug'];

        if (debugMessage) {
          this.$logger.warn(debugMessage);
        }

        if (resp.statusCode >= 300) {
          reject(new ResponseError(opts, resp, body));
          return;
        }

        resolve(body);
      });
    });
  }

  rules(rules) {
    if (!this.auth) {
      return Promise.reject(new Error(ERR_NO_SECRET));
    }

    const opts = {
      'method': 'GET',
      'url': `${this.rootPath}/.settings/rules.json`,
      'qs': {auth: this.auth}
    };

    return new Promise((resolve, reject) => {
      if (rules) {
        opts.method = 'PUT';
        opts.body = rules;
        opts.json = typeof(rules) === 'object';
      }

      request(opts, (err, resp, body) => {
        if (err) {
          reject(err);
          return;
        }

        if (resp.statusCode >= 300) {
          reject(new ResponseError(opts, resp, body));
          return;
        }

        resolve(body);
      });
    });
  }

  get(qs) {
    return this.process(this.url, 'GET', qs);
  }

  set(payload, qs) {
    return this.process(this.url, 'PUT', qs, payload);
  }

  update(payload, qs) {
    let url;

    if (this.url.endsWith('/.json')) {
      url = this.url;
    } else if (this.url.endsWith('.json')) {
      url = `${this.url.slice(0, -5)}/.json`;
    } else if (this.url.endsWith('/')) {
      url = `${this.url}.json`;
    } else {
      url = `${this.url}/.json`;
    }

    return this.process(url, 'PATCH', qs, payload);
  }

  push(patch, qs) {
    return this.process(this.url, 'POST', qs, patch);
  }

  remove(qs) {
    return this.process(this.url, 'DELETE', qs);
  }
}

function trimPath(path) {
  return path.replace(/\/+$/, '');
}

/**
 * Create a firebase rest client factory.
 *
 * The clients will be bound to a firebase ID. You then can use relative path
 * to create references to entities in your Firebase DB.
 *
 * Usage:
 *
 *    const restFirebase = require('rest-firebase');
 *    const firebase = restFirebase.factory('some-id');
 *    const ref = firebase({paths: 'some/path', auth: 'some-oauth-token'});
 *
 *    // you can pass parameters
 *    // (see https://www.firebase.com/docs/rest/api/#section-query-parameters)
 *    ref.get({shallow: true}).then(value => {
 *        // ...
 *    });
 *
 * @param  {string}   target Firebase ID or URL
 * @return {function}
 *
 */
function restFirebaseFactory(target) {
  let rootPath;

  if (VALID_URL.test(target)) {
    rootPath = trimPath(target);
  } else if (VALID_ID.test(target)) {
    rootPath = `https://${target}.firebaseio.com`;
  } else {
    throw new Error(ERR_INVALID_ID);
  }

  function restFirebase(opts) {
    const relPaths = opts && opts.paths || '';
    const url = [rootPath].concat(relPaths).join('/');

    return new Request(
      Object.assign({}, opts, {rootPath, url})
    );
  }

  return restFirebase;
}

exports.Request = Request;
exports.factory = restFirebaseFactory;
