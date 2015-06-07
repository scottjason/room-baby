/**
 * User Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var authCtrl = require('../controllers/auth');
var userCtrl = require('../controllers/user');

module.exports = function(app, passport) {

  /* Auth-Protected EndPoints */
  router.post('/authenticate', authCtrl.isAuthenticated);
  router.post('/update', authCtrl.isAuthenticated, userCtrl.update);

  /* Not Protected EndPoints */
  router.post('/reset', userCtrl.resetPass);
  router.post('/save-user-name', userCtrl.saveUserName);
  router.get('/reset/:token', userCtrl.resetPassCallback)
  router.post('/reset-submit', userCtrl.resetPassSubmit);
  router.get('/logout/:user_id', userCtrl.logout);
  router.get('/get-one/:user_id', userCtrl.getOne);
  router.get('/get-all/:user_id', userCtrl.getAll);

  router.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user, data) {
      if (err) return next(err);
      if (!user) return res.status(401).json(data);

      var otSessions = data;

      req.logIn(user, function(err) {
        if (err) return next(err)

        if (!req.body.rememberMe) {
          req.session.cookie.expires = false;
        }

        req.session.user = user;

        if (otSessions) {
          req.session.otSessions = otSessions;
        }
        return res.json({
          user: user,
          sessions: otSessions
        });
      });
    })(req, res, next);
  });

  router.post('/register', function(req, res, next) {
    passport.authenticate('local-register', function(err, user, data) {
      if (err) return next(err);
      if (!user) return res.status(401).json(data);

      var otSessions = data;

      req.logIn(user, function(err) {
        if (err) return next(err);

        req.session.user = user;

        if (otSessions) {
          req.session.otSessions = otSessions;
        }
        return res.json({
          user: user,
          session: otSessions
        });
      });
    })(req, res, next);
  });

  app.use('/user', router);
}
