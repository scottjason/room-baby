/**
 * App Init
 */

'use strict'

var fs = require('fs');
var express = require('express');
var config = require('./config');
var passport = require('passport');
var database = require('./config/database')
var worker = require('./config/utils/worker');

var app = express();

/* Bootstrap models */
fs.readdirSync(config.root + '/server/models').forEach(function(file) {
  if (~file.indexOf('.js')) require(config.root + '/server/models/' + file);
});

/* Config passport, express, routes, error handler */
require('./config/passport/local-init')(passport);
require('./config/express')(app, passport);
require('./routes/user')(app, passport);
require('./routes/auth')(app, passport);
require('./routes/session')(app);
require('./routes/archive')(app);
require('./routes/index')(app, passport);
require('./routes/error')(app);

/* Connect to the database, then start server and worker */
database.connect(function() {
  /* Start server */
  app.listen(app.get('port'), function() {
    console.log('Server listening on port', this.address().port, 'in', app.get('env'), 'mode.');
    /* Start worker */
    worker.start();
    // worker.sendMail();
  });
});

/* Expose the app */
module.exports = app;
