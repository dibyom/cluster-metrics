'use strict';

var metrics = require('measured');
var collection = new metrics.Collection('http');
var http = require('http');

var rps = collection.meter('requestsPerSecond');
rps.mark();

http.createServer(function (req, res) {
  console.error(req.headers['content-length']);
  collection.meter('requestsPerSecond').mark();
  res.end('Thanks');
}).listen(8000);



setInterval(function () {
  console.log(collection.toJSON());
}, 1000);
