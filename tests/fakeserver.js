'use strict';

const http = require('http');

class FakeServer {

  constructor(opts) {
    this.returns = opts && opts.returns || [];
    this.port = opts && opts.port;
    this.server = undefined;
    this.calls = [];
  }

  start() {
    this.server = http.createServer((req, resp) => this.handler(req, resp));
    this.server.listen(this.port);
  }

  stop() {
    this.server.close();
  }

  handler(req, resp) {
    this.calls.push(req);

    if (typeof this.returns === 'function') {
      this.returns(req, resp);
      return;
    }

    if (this.returns.length < this.calls.length) {
      resp.writeHead(400, {'Content-Type': 'application/json'});
      resp.end('{"error": "unexpected"}');
      return;
    }

    const returnHandler = this.returns[this.calls.length - 1];

    if (typeof returnHandler === 'function') {
      returnHandler(req, resp);
    } else {
      resp.writeHead(200, {'Content-Type': 'application/json'});
      resp.end(JSON.stringify(returnHandler));
    }
  }
}

exports.factory = opts => new FakeServer(opts);
