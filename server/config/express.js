/**
 * Express Configuration
 */

'use strict';

var express = require('express');
var path = require('path');
var compression = require('compression');
var logger = require('morgan');
var bodyParser = require('body-parser');
var multer  = require('multer')
var methodOverride = require('method-override');
var session = require('express-session');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var seedDb = require('./seed');
var config = require('./');

module.exports = function(app, passport){

  app.set('env', process.env.NODE_ENV || 'development');
  app.set('port', config.server.port);

  app.enable('trust proxy');
  app.disable('x-powered-by');

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');

  app.use(compression({ threshold: 512 }));

  app.use(express.static(path.join(config.root, 'client')));

  if ('development' === app.get('env')) {
    app.use(logger('dev'));
    // seedDb.init();
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer({ dest: config.root + 'server/uploads/'}))

  app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  app.use(cors());
  app.use(cookieParser(config.sessionOpts.secret));
  app.use(session(config.sessionOpts));
  app.use(passport.initialize());
  app.use(passport.session());
}