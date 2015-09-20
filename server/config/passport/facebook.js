var User = require('../../models/user');
var FacebookStrategy = require('passport-facebook').Strategy;
var FB = require('fb');
var config = require('../');

module.exports = function(passport) {

  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
    },

    function(token, refreshToken, profile, callback) {

      var profileImage;
      
      process.nextTick(function() {

        FB.api('/me?fields=picture.type(small),email&access_token=' + token, function(response) {

          var email = response.email;

          if (response.picture && response.picture.data.url) {
            profileImage = response.picture.data.url;
          }
          User.findOne({
            email: email
          }, function(err, user) {
            if (err) return callback(err);
            if (user) {
              user.facebook.email = user.email;
              if (profileImage) {
                user.profileImage = profileImage;
              }
              user.save(function(err, savedUser) {
                if (err) return callback(err);
                callback(null, savedUser);
              })
            } else {
              var newUser = new User();
              newUser.email = email;
              if (profileImage) {
                newUser.profileImage = profileImage;
              }
              newUser.facebook.email = newUser.email
              newUser.save(function(err, savedUser) {
                if (err) return callback(err);
                callback(null, savedUser);
              });
            }
          })
        });
      });
    }));
};
