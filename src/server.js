var Metrics = require( 'metrics' );
var	postal = require( 'postal' );
var commands = postal.channel( 'incomming' );
var	cluster = require( 'cluster' );
var _ = require( 'lodash' );
var	Api = require( './api.js' );
var	os = require( 'os' );
var	report;

var createMetric = function( type, name ) {
  var metric = report.getMetric( name );
  if( !metric ) {
    metric = new Metrics[ type ]();
    report.addMetric( name, metric );
  }
  return metric;
};

var	apply = function( type, name, fun ) {
  fun( createMetric( type, name ) );
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

commands.subscribe( '#', function( msg, env ) {
  var parts = env.topic.split( '.' ),
    type = parts[ 1 ],
    op = parts[ 0 ],
    name = msg.name,
    metric = createMetric( type, name );
  operations[ op ]( metric, msg );
} );

var MB = 1024 * 1024;
var	GB = MB * 1024;
var	total = os.totalmem();
var	TOTALMB = total / MB;
var	TOTALGB = total / GB;
var	memoryList = {};

var	listen = function() {
  report = new Metrics.Report();
  cluster.on( 'online', function( worker ) {
    worker.on( 'message', function( data ) {
      if( data.type == 'report' ) {
        worker.send( { type: 'report', report: report.summary() } );
      } else if ( data.type == 'memory' ) {
        memoryList[ worker.id ] = data.message;
      } else {
        commands.publish( data.type, data.message );
      }
    } );
  } );

  report.getMetrics = function( callback ) {
    var  metrics = report.summary();
    callback( metrics );
  };

  var send = function( type, message ) {
    commands.publish( type, message );
  };

  return _.merge( report, new Api( send ) );
};

module.exports = listen;
