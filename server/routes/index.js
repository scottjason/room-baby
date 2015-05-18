/**
 * Index Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var indexCtrl = require('../controllers/index');

module.exports = function(app, passport) {
  router.get('/', indexCtrl.render);
  router.get('/dashboard', indexCtrl.render);
  router.get('/dashboard/session', indexCtrl.render);
  router.get('/dashboard/:user_id', indexCtrl.isAuthenticated, indexCtrl.render);
  app.use('/', router);
}