'use strict';

var cluster = require('cluster');

var	client = require('./client.js');
var server = require('./server.js');

if (cluster.isMaster) {
  module.exports = server();
} else {
  module.exports = client();
}
