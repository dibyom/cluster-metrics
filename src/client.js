'use strict';
var _ = require('lodash');

var Api = require('./api.js');

var	client = function() {
		var waiting = [],
			send = function( type, message ) {
				process.send(  { type: type, message: message } ) ;
			};

		process.on( 'message', function( metrics ) {
			_.each( waiting, function( callback ) {
				callback( metrics );
			} );
			waiting = [];
		} );

		var api = new Api( send );
		api.getMetrics = function( callback ) {
			var inWaiting = waiting.length;
			waiting.push( callback );
			if( !inWaiting ) {
				send( 'report', '' );
			}
		};

		return api;
};

module.exports = client;
