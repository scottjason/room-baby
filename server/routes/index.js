/**
 * Index Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var authCtrl = require('../controllers/auth');
var indexCtrl = require('../controllers/index');

module.exports = function(app, passport) {
  router.get('/', indexCtrl.render);
  router.get('/dashboard/:user_id', authCtrl.isAuthenticated, indexCtrl.render);
  router.get('/broadcast/:broadcast_id', indexCtrl.render);
  app.use('/', router);
}