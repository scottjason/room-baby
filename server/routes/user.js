/**
 * User Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var userCtrl = require('../controllers/user');
var authCtrl = require('../controllers/auth');

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
    console.log(req.body)
    passport.authenticate('local-login', function(err, user, msgOrSession) {
      /* if '!user' then 'msgOrSession = message */
      if (err) return next(err);
      if (!user) return res.status(401).send(msgOrSession);
      /* if '!err && user' then 'msgOrSession = otSession || null' */
      var otSession = msgOrSession;
      req.logIn(user, function(err) {
        if (err) return next(err)

        if(!req.body.rememberMe) {
          req.session.cookie.expires = false;
        }

        req.session.user = user;

        if(otSession){
          req.session.otSession = otSession;
        }
        return res.json({ user: req.session.user, session: req.session.otSession || null });
      });
    })(req, res, next);
  });

  router.post('/register', function(req, res, next) {
    passport.authenticate('local-register', function(err, user, msgOrSession) {
      /* if '!user' then 'msgOrSession = message */
      if (err) return next(err);
      if (!user) return res.status(401).send(msgOrSession);
      /* if '!err && user' then 'msgOrSession = otSession || null' */
      var otSession = msgOrSession;
      req.logIn(user, function(err) {
        if (err) return next(err);

        if(!req.body.rememberMe) {
          req.session.cookie.expires = false;
        }
        req.session.user = user;

        if(otSession){
          req.session.otSession = otSession;
        }
        return res.json({ user: req.session.user, session: req.session.otSession || null });
      });
    })(req, res, next);
  });

 app.use('/user', router);
}