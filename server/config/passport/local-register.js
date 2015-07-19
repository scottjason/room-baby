/**
 * Passport Local Register
 */

'use strict';

var config = require('../../config');
var dialog = require('../utils/dialog');
var User = require('../../models/user');
var Session = require('../../models/session');
var LocalStrategy = require('passport-local').Strategy;

exports.getAll = function(user, callback) {
 var allSessions = [];
  Session.find({ users: { $elemMatch: { _id: user._id } } }, function (err, sessions) {
    if (err) return callback(err, null, null);
    if(!sessions.length) return callback(null, user, allSessions);
    sessions.forEach(function(session){
      session.key = config.openTok.key;
      session.secret = config.openTok.secret;
      allSessions.push(session);
    })
    callback(null, user, allSessions);
  });
};

module.exports = function(passport) {
  passport.use('local-register', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, callback) {
      User.findOne({ email: email }, function(err, user) {
        if (err) return callback(err);
        if (user) return callback(null, null, { message: dialog.emailAlreadyExists });
        var user = new User();
        user.username = req.body.username;
        user.email = email;
        user.password = password;
        user.save(function(err, savedUser) {
          if (err) return callback(err);
          user.password = null;
          exports.getAll(savedUser, callback);
        });
      });
    })
  )
};