angular.module('RoomBaby')
  .factory('validator', function() {

    var usernameRegEx = /^([a-zA-Z0-9_-]){3,8}$/;
    var emailRegEx = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    function validatePassword(password) {
      if (password.length < 6 || password.length > 50 || (password.search(/\d/) === -1) || (password.search(/[a-zA-Z]/) === -1) || (password.search(/[^a-zA-Z0-9\!\@\#\$\%\^\&\*\(\)\_\+]/) != -1)) {
        return null
      } else {
        return true;
      }
    };

    function validateLogin(obj, cb) {
      var email = obj.email;
      if (!(emailRegEx.test(email))) {
        cb(null);
        else {
          cb(true);
        }
      }
    };

    function validateRegister(obj, cb) {
      var username = obj.username;
      var email = obj.email;
      var password = obj.password;
      if (!(usernameRegEx.test(username))) {
        cb('username', null)
      } else if (!(emailRegEx.test(email))) {
        cb('email', null);
      } else if (!(validatePassword(password))) {
        cb('password', null);
      } else {
        cb(null, true);
      }
    };
    return {
      validateLogin: validateLogin,
      validateRegister: validateRegister
    };
  });
