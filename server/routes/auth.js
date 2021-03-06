/**
 * auth Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var indexCtrl = require('../controllers/index');
var sessionCtrl = require('../controllers/session');

module.exports = function(app, passport) {
  router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile', 'publish_actions'] }));
  router.get('/facebook/callback', passport.authenticate('facebook', { successRedirect: '/auth/fb-success', failureRedirect: '/auth/fb-fail' }));
  router.get('/fb-success', function(req, res, next){
    req.session.user = req.user;
    res.redirect('/dashboard/' + req.session.passport.user);
  });
  router.get('/fb-fail', function(req, res, next){
    res.redirect('/');
  });
  app.use('/auth', router);
}
