/**
 * Passport Init
 */

'use strict';

var User = require('../../models/user');

module.exports = function(passport) {
  passport.serializeUser(function(user, callback) {
    console.log('serializeUser called with user', user)
    callback(null, user._id);
  });
  passport.deserializeUser(function(id, callback) {
    User.findById(id, function(err, user) {
      callback(err, user);
    });
  });
  require('./local-login')(passport);
  require('./local-register')(passport);
  require('./facebook')(passport);
};