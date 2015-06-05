/**
 * Server Init
 */

'use strict'

var fs = require('fs');
var util = require('util');
var express = require('express');
var config = require('./config');
var passport = require('passport');
var io = require('socket.io');
var socketCtrl = require('./controllers/socket');
var sessionCtrl = require('./controllers/session');
var userCtrl = require('./controllers/user');

var app = express();

/* Bootstrap Models */
fs.readdirSync(config.root + '/server/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(config.root + '/server/models/' + file);
});

/* Invoked the database and pass the host */
require('./config/database').connect()

/* Invoke The Database, Config Passport, Express, Routes, Error Handler */
require('./config/passport/local-init')(passport);
require('./config/express')(app, passport);
require('./routes/user')(app, passport);
require('./routes/auth')(app, passport);
require('./routes/session')(app);
require('./routes/index')(app, passport);
require('./routes/error')(app);

/* Start Server */
var server = app.listen(app.get('port'), function(){
  console.log('Server listening on port', this.address().port, 'in', app.get('env'), 'mode.');
});

io = io.listen(server);

/* Pass IO Instance */
socketCtrl.onSocket(io);
sessionCtrl.onSocket(io);
userCtrl.onSocket(io);

module.exports = app;