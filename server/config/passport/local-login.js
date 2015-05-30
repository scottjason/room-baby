/**
 * Passport Local Login
 */

'use strict';

var config = require('../../config');
var dialog = require('../utils/dialog');
var Session = require('../../models/session');
var User = require('../../models/user');
var LocalStrategy = require('passport-local').Strategy;

var getAll = function(user, callback) {
 var allSessions = [];
  Session.find({ users: { $elemMatch: { _id: user._id } } }, function (err, sessions) {
    if (err) return callback(err, null, null);
    if(!sessions.length) return callback(null, user, null);
    sessions.forEach(function(session){
      session.key = config.openTok.key;
      session.secret = config.openTok.secret;
      allSessions.push(session);
    })
    callback(null, user, allSessions);
  });
}

module.exports = function(passport) {
  passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, callback) {
      User.findOne({ email: email }, function(err, user) {
        if (err) return callback(err);
        if (!user) return callback(null, false, { message: dialog.noEmailFound });
        user.verifyPassword(password, function(err, isMatch) {
          if (err) return callback(err);
          if (!isMatch) return callback(null, false, { message: dialog.wrongPassword });
          user.password = null;
          getAll(user, callback);
        });
      })
    })
  )
};