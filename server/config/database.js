/**
 * Database Configuration
 */

'use strict';

var config = require('./');
var mongoose = require('mongoose');
var User = require('../models/user');

var connect = function(cb) {
  exports.cb = cb;
  mongoose.connect(config.db.uri, config.db.opts);
};

var connected = function() {
  exports.cb();
  console.log("Database connected at", config.db.uri);
};

mongoose.connection.on('connected', connected);
mongoose.connection.on('disconnected', connect);
mongoose.connection.on('error', console.log);
// mongoose.set('debug', true);

module.exports = {
  connect: connect
}
