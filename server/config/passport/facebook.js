var User = require('../../models/user');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../');

module.exports = function(passport) {

  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
  },

  function(token, refreshToken, profile, callback) {
    process.nextTick(function() {
      User.findOne({ email: profile._json.email }, function(err, user) {
        if (err) return callback(err);
        if (user) {
          user.facebook.id = profile.id;
          user.facebook.email = user.email;
          user.facebook.firstName = profile._json.first_name;
          user.facebook.lastName = profile._json.lastame;
          user.facebook.token = token;
          user.save(function(err, savedUser) {
            if (err) return callback(err);
            callback(null, savedUser);
          })
        } else {
          var newUser = new User();
          newUser.email = profile._json.email;
          newUser.facebook.id = profile.id;
          newUser.facebook.email = newUser.email
          newUser.facebook.firstName = profile._json.first_name
          newUser.facebook.lastName = profile._json.lastame
          newUser.facebook.token = token;
          newUser.save(function(err, savedUser) {
            if (err) return callback(err);
            callback(null, savedUser);
          });
        }
      })
    });
  }))
}
