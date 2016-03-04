'use strict';

const jsonBody = require('body/json');
const expect = require('expect.js');
const firebase = require('../');
const url = require('url');
const fakeServer = require('./fakeserver');

describe('factory', function() {

  it('should bind to a firebase id', function() {
    const factory = firebase.factory('singpath');
    const ref = factory();

    expect(ref.toString()).to.be('https://singpath.firebaseio.com/.json');
  });

  it('should bind to a firebase url', function() {
    const factory = firebase.factory('https://singpath.firebaseio.com');
    const ref = factory();

    expect(ref.toString()).to.be('https://singpath.firebaseio.com/.json');
  });

  it('should throw if asked to bind to an invalid id', function() {
    expect(() => firebase.factory('foo.bar')).to.throwError();
  });

  it('should throw if asked to bind to an invalid url', function() {
    expect(() => firebase.factory('foo.bar.com')).to.throwError();
  });

  it('should reference a path (as string)', function() {
    const factory = firebase.factory('https://singpath.firebaseio.com');
    const paths = 'foo/bar';
    const ref = factory({paths});

    expect(ref.toString()).to.be('https://singpath.firebaseio.com/foo/bar.json');
  });

  it('should reference a path (as array)', function() {
    const factory = firebase.factory('https://singpath.firebaseio.com');
    const paths = ['foo', 'bar'];
    const ref = factory({paths});

    expect(ref.toString()).to.be('https://singpath.firebaseio.com/foo/bar.json');
  });

  describe('operations', function() {
    const port = 8000;
    const paths = 'foo/bar';
    const auth = 'some-token';
    let server, ref;

    beforeEach(function() {
      const factory = firebase.factory(`http://127.0.0.1:${port}`);

      ref = factory({paths, auth});
      server = fakeServer.factory({port});
      server.start();
    });

    afterEach(function() {
      server.stop();
    });

    describe('get', function() {

      it('should send a GET request', function() {
        server.returns.push((req, resp) => {
          expect(req.method).to.be('GET');
          expect(req.url).to.be('/foo/bar.json?auth=some-token');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        return ref.get().then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should resolve with the firebase value', function() {
        const expected = {some: 'value'};

        server.returns.push((req, resp) => {
          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end(JSON.stringify(expected));
        });

        return ref.get().then(
          actual => expect(actual.body).to.eql(expected)
        );
      });

      it('should resolve with the firebase debug messages', function() {
        const debugMsg = 'some message';

        server.returns.push((req, resp) => {
          resp.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Firebase-Auth-Debug': debugMsg
          });
          resp.end('{"some": "value"}');
        });

        return ref.get().then(
          actual => expect(actual.authDebug).to.eql(debugMsg)
        );
      });

      it('should send options as query string', function() {
        server.returns.push((req, resp) => {
          const reqUrl = url.parse(req.url, true);

          expect(reqUrl.query.print).to.be('pretty');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        return ref.get({print: 'pretty'});
      });

      it('should reject if the request failed', function() {
        server.stop();

        return ref.get().then(
          () => Promise.reject(new Error('Unexpected')),
          () => undefined
        );
      });

      it('should reject if the server returns an error', function() {
        const msg = {error: 'server down'};

        server.returns.push((req, resp) => {
          resp.writeHead(500, {'Content-Type': 'application/json'});
          resp.end(JSON.stringify(msg));
        });

        return ref.get().then(
          () => Promise.reject(new Error('Unexpected')),
          err => {
            expect(err.url).to.be('http://127.0.0.1:8000/foo/bar.json');
            expect(err.method).to.be('GET');
            expect(err.status).to.be(500);
            expect(err.body).to.eql(msg);
          }
        );
      });

      it('should reject with firebase rules debug messages', function() {
        const debugMsg = 'some message';

        server.returns.push((req, resp) => {
          resp.writeHead(401, {
            'Content-Type': 'application/json',
            'X-Firebase-Auth-Debug': debugMsg
          });
          resp.end('{"error": "unauthorized"}');
        });

        return ref.get().then(
          () => Promise.reject(new Error('Unexpected')),
          err => expect(err.authDebug).to.be(debugMsg)
        );
      });

    });

    describe('set', function() {

      it('should send a PUT request', function() {
        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar.json?auth=some-token');
          expect(req.method).to.be('PUT');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        return ref.set({some: 'value'}).then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should send the payload as request body', function(done) {
        const payload = {some: 'value'};

        server.returns.push((req, resp) => {
          jsonBody(req, (err, body) => {
            expect(body).to.eql(body);
            done();
          });

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        ref.set(payload);
      });

      it('should resolve with the firebase debug messages', function() {
        const debugMsg = 'some message';

        server.returns.push((req, resp) => {
          resp.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Firebase-Auth-Debug': debugMsg
          });
          resp.end();
        });

        return ref.set({some: 'value'}).then(
          actual => expect(actual.authDebug).to.eql(debugMsg)
        );
      });

      it('should send options as query string', function() {
        server.returns.push((req, resp) => {
          const reqUrl = url.parse(req.url, true);

          expect(reqUrl.query.print).to.be('pretty');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        return ref.set({some: 'value'}, {print: 'pretty'});
      });

    });

    describe('update', function() {

      it('should send a PATCH request', function() {
        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar/.json?auth=some-token');
          expect(req.method).to.be('PATCH');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        return ref.update({some: 'value'}).then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should target a directory 1/4', function() {
        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar/.json?auth=some-token');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        ref.url += '.json';

        return ref.update({some: 'value'}).then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should target a directory 1/4', function() {
        const factory = firebase.factory(`http://127.0.0.1:${port}`);

        ref = factory({paths: 'foo/bar.json', auth});

        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar/.json?auth=some-token');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        return ref.update({some: 'value'}).then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should target a directory 2/4', function() {
        const factory = firebase.factory(`http://127.0.0.1:${port}`);

        ref = factory({paths: 'foo/bar/.json', auth});

        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar/.json?auth=some-token');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        return ref.update({some: 'value'}).then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should target a directory 4/4', function() {
        const factory = firebase.factory(`http://127.0.0.1:${port}`);

        ref = factory({paths: 'foo/bar/', auth});

        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar/.json?auth=some-token');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        return ref.update({some: 'value'}).then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should send the payload as request body', function(done) {
        const payload = {some: 'value'};

        server.returns.push((req, resp) => {
          jsonBody(req, (err, body) => {
            expect(body).to.eql(body);
            done();
          });

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        ref.update(payload);
      });

      it('should resolve with the firebase debug messages', function() {
        const debugMsg = 'some message';

        server.returns.push((req, resp) => {
          resp.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Firebase-Auth-Debug': debugMsg
          });
          resp.end('{"some": "value"}');
        });

        return ref.update({some: 'value'}).then(
          actual => expect(actual.authDebug).to.eql(debugMsg)
        );
      });

      it('should send options as query string', function() {
        server.returns.push((req, resp) => {
          const reqUrl = url.parse(req.url, true);

          expect(reqUrl.query.print).to.be('pretty');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        return ref.update({some: 'value'}, {print: 'pretty'});
      });

    });

    describe('remove', function() {

      it('should send a DELETE request', function() {
        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar.json?auth=some-token');
          expect(req.method).to.be('DELETE');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        return ref.remove().then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should resolve with the firebase debug messages', function() {
        const debugMsg = 'some message';

        server.returns.push((req, resp) => {
          resp.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Firebase-Auth-Debug': debugMsg
          });
          resp.end('{"some": "value"}');
        });

        return ref.remove().then(
          actual => expect(actual.authDebug).to.eql(debugMsg)
        );
      });

      it('should send options as query string', function() {
        server.returns.push((req, resp) => {
          const reqUrl = url.parse(req.url, true);

          expect(reqUrl.query.print).to.be('pretty');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        return ref.remove({print: 'pretty'});
      });

    });

    describe('push', function() {

      it('should send a POST request', function() {
        server.returns.push((req, resp) => {
          expect(req.url).to.be('/foo/bar.json?auth=some-token');
          expect(req.method).to.be('POST');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        return ref.push({some: 'value'}).then(
          () => expect(server.calls).to.have.length(1)
        );
      });

      it('should send the payload as request body', function(done) {
        const payload = {some: 'value'};

        server.returns.push((req, resp) => {
          jsonBody(req, (err, body) => {
            expect(body).to.eql(body);
            done();
          });

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end('{"some": "value"}');
        });

        ref.push(payload);
      });

      it('should resolve with the firebase debug messages', function() {
        const debugMsg = 'some message';

        server.returns.push((req, resp) => {
          resp.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Firebase-Auth-Debug': debugMsg
          });
          resp.end('{"some": "value"}');
        });

        return ref.push({some: 'value'}).then(
          actual => expect(actual.authDebug).to.eql(debugMsg)
        );
      });

      it('should send options as query string', function() {
        server.returns.push((req, resp) => {
          const reqUrl = url.parse(req.url, true);

          expect(reqUrl.query.print).to.be('pretty');

          resp.writeHead(200, {'Content-Type': 'application/json'});
          resp.end();
        });

        return ref.push({some: 'value'}, {print: 'pretty'});
      });

    });

  });

});
