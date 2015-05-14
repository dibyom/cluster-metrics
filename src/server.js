'use strict';

var _ = require('lodash');
var measured = require('measured');
var	postal = require('postal');
var cluster = require('cluster');
var Api = require('./api.js');
var report = measured.createCollection();

var createMetric = function createMetric(type, name) {
  return Object
    .getPrototypeOf(report)[type.toLowerCase()]
    .call(report, name);
};

var operations = {
  incr: function incr(counter, msg) {
    counter.inc(msg.val);
  },

  decr: function decr(counter, msg) {
    counter.dec(msg.val);
  },

  occ: function occ(meter, msg) {
    meter.mark(msg.val);
  },

  dur: function dur(timer, msg) {
    timer.update(msg.val);
  },

  hist: function hist(histogram, msg) {
    histogram.update(msg.val, Date.now());
  }
};

var commands = postal.channel('incoming');
var	listen = function listen() {
  var send = function send(type, message) {
    commands.publish(type, message);
  };

  cluster.on('online', function online(worker) {
    worker.on('message', function message(data) {
      /*eslint-disable no-unused-expressions */
      data.type === 'report'
        ? worker.send({ type: 'report', report: report.toJSON() })
        : commands.publish(data.type, data.message);
      /*eslint-disable no-unused-expressions */
    });
  });

  report.getMetrics = function onMetrics(callback) {
    callback(report.toJSON());
  };

  return _.merge(report, new Api(send));
};

commands.subscribe('#', function incoming(msg, env) {
  var parts = env.topic.split('.');
  var type = parts[ 1 ];
  var op = parts[ 0 ];
  var name = msg.name;
  var metric = createMetric(type, name);
  operations[op](metric, msg);
});

module.exports = listen;
