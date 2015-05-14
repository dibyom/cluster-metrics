'use strict';
var _ = require('lodash');

var Api = require('./api.js');

var	client = function client() {
  var waiting = [];

  var	send = function send(type, message) {
    process.send({ type: type, message: message });
  };

  var api = new Api(send);
  process.on('message', function onMessage(metrics) {
    _.each(waiting, function eachWaiting(callback) {
      callback(metrics);
    });

    waiting = [];
  });

  api.getMetrics = function onMetrics(callback) {
    var inWaiting = waiting.length;
    waiting.push(callback);
    if (!inWaiting) {
      send('report', '');
    }
  };

  return api;
};

module.exports = client;
