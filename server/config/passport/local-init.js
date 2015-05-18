/**
 * Passport Init
 */

'use strict';

var User = require('../../models/user');

module.exports = function(passport) {
  passport.serializeUser(function(user, callback) {
    callback(null, user.id);
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