/**
 * Passport Local Login
 */

'use strict';

var config = require('../../config');
var dialog = require('../utils/dialog');
var Session = require('../../models/session');
var Archive = require('../../models/archive');
var User = require('../../models/user');
var LocalStrategy = require('passport-local').Strategy;

var getAllArchives = function(user, obj, callback) {
  console.log('user', user);
  Archive.find({ users: { $elemMatch: { _id: user._id } } }, function(err, archives) {
    console.log('archives on login', archives);
    if (err) return callback(err);
    obj.archives = archives.length ? archives : null;
    callback(null, user, obj);
  });
};

var getAllSessions = function(user, callback) {

  var obj = {};
  obj.otSessions = null;
  var otSessions = [];

  Session.find({ users: { $elemMatch: { _id: user._id } } }, function (err, sessions) {
    if (err) return callback(err);
    if(!sessions.length) return getAllArchives(user, obj, callback);
    sessions.forEach(function(session){
      session.key = config.openTok.key;
      session.secret = config.openTok.secret;
      otSessions.push(session);
    });
    obj.otSessions = otSessions.length ? otSessions : obj.otSessions;
    getAllArchives(user, obj, callback);
  });
};

module.exports = function(passport) {
  passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, callback) {
      User.findOne({ email: email }, function(err, user) {
        if (err) return callback(err);
        if (!user) return callback(null, null, { message: dialog.noEmailFound });
        user.verifyPassword(password, function(err, isMatch) {
          if (err) return callback(err);
          if (!isMatch) return callback(null, null, { message: dialog.wrongPassword });
          user.password = null;
          getAllSessions(user, callback);
        });
      })
    })
  )
};