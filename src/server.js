'use strict';

var _ = require('lodash');
var measured = require('measured');
var	postal = require( 'postal' );

var cluster = require('cluster');
var os = require('os');

var Api = require('./api.js');

var report = measured.createCollection();

var commands = postal.channel( 'incomming' );

commands.subscribe('#', function (msg, env) {
  var parts = env.topic.split('.');
  var type = parts[ 1 ];
  var op = parts[ 0 ];
  var name = msg.name;
  var metric = createMetric(type, name);
  operations[op](metric, msg);
});

var createMetric = function( type, name ) {
  return report
    .__proto__[type.toLowerCase()]
    .call(report, name);
};

var	operations = {
  incr: function( counter, msg ) {
    counter.inc( msg.val );
  },
  decr: function( counter, msg ) {
    counter.dec( msg.val );
  },
  occ: function( meter, msg ) {
    meter.mark( msg.val );
  },
  dur: function( timer, msg ) {
    timer.update( msg.val );
  },
  hist: function( histogram, msg ) {
    histogram.update( msg.val, Date.now() );
  }
};

var	listen = function() {
  cluster.on( 'online', function( worker ) {
    worker.on( 'message', function( data ) {
      if( data.type == 'report' ) {
        worker.send( { type: 'report', report: report.toJSON() } );
      } else {
        commands.publish( data.type, data.message );
      }
    } );
  } );

  report.getMetrics = function( callback ) {
    callback( report.toJSON() );
  };

  var send = function( type, message ) {
    commands.publish( type, message );
  };

  return _.merge(report, new Api(send));
};

module.exports = listen;
