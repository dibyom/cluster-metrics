'use strict';

var	_ = require('lodash');

var Api = function Api(send) {
  var cache = {};

  var factory = function factory(Type) {
    return function createType(name) {
      if (!cache[ name ]) {
        cache[ name ] = new Type(name);
      }

      return cache[ name ];
    };
  };

  var	Counter = function Counter(name) {
    return {
      incr: function incr(val) {
        send('incr.Counter', { name: name, val: val || 1 });
      },

      decr: function decr(val) {
        send('decr.Counter', { name: name, val: val || 1 });
      }
    };
  };

  var	Histogram = function Histogram(name) {
    return {
      record: function record(val) {
        send('hist.Histogram', { name: name, val: val || 1 });
      }
    };
  };

  var	Meter = function Meter(name) {
    return {
      record: function record(val) {
        send('occ.Meter', { name: name, val: val || 1 });
      }
    };
  };

  var	Timer = function Timer(name) {
    this.last = 0;
    this.name = name;
    _.bindAll(this);
  };

  Timer.prototype.start = function timerStart() {
    this.last = Date.now();
  };

  Timer.prototype.record = function timerRecord(val) {
    if (!val && this.last) {
      val = Date.now() - this.last; // eslint-disable-line no-param-reassign
    }

    if (val) {
      send('dur.Timer', { name: this.name, val: val });
    }
  };

  return {
    counter: factory(Counter),
    histogram: factory(Histogram),
    meter: factory(Meter),
    timer: factory(Timer)
  };
};

module.exports = Api;
