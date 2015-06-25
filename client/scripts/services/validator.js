angular.module('RoomBaby')
  .factory('validator', function() {

    var invalidUserName = 'please enter a valid username, minimum three characters';
    var invalidEmail = 'please enter a valid email';
    var invalidPassword = 'please enter a valid password, minimum six characters';
    var invalidTitle = 'please enter a valid room title, between three and twenty six characters';
    var invalidDate = 'please select a start date and start time for this room';

    var userNameRegEx = /^([a-zA-Z0-9_-]){3,8}$/;
    var emailRegEx = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    function validate(obj, cb) {
      if (obj.type === 'login') {
        validateLogin(obj, cb);
      } else if (obj.type === 'register') {
        validateRegistration(obj, cb);
      } else if (obj.type === 'createRoom:email') {
        validateEmail(obj.guestEmail, cb);
      } else if (obj.type === 'email') {
        validateEmail(obj.email, cb);
      }
    }

    function validateEmail(guestEmail, cb) {
      var isValidEmail = emailRegEx.test(guestEmail);
      if (!isValidEmail) return cb(null);
      cb(true);
    }

    function validateLogin(obj, cb) {
      var validEmail = emailRegEx.test(obj.email);
      var validPassword = (obj.password && (obj.password.length >= 3) && (obj.password.length <= 50));
      if (!validEmail) {
        cb(null, 'email', invalidEmail);
      } else if (!validPassword) {
        cb(null, 'password', invalidPassword);
      } else {
        cb(true, null, null);
      }
    };

    function validateRegistration(obj, cb) {
      var validUserName = userNameRegEx.test(obj.username);
      var validEmail = emailRegEx.test(obj.email);
      var validPassword = (obj.password && (obj.password.length >= 3) && (obj.password.length <= 50));

      if (!validUserName) {
        cb(null, 'username', invalidUserName);
      } else if (!validEmail) {
        cb(null, 'email', invalidEmail);
      } else if (!validPassword) {
        cb(null, 'password', invalidPassword);
      } else {
        cb(true, null, null);
      }
    };

    function validateInvite(obj, cb) {
      var isValidTitle = ((obj.title.length >= 3) && (obj.title.length <= 26));
      var isValidEmail = emailRegEx.test(obj.guestEmail);
      var isValidDate = (obj.startsAt.length);

      if (!isValidTitle) {
        cb(null, 'title', invalidTitle);
      } else if (!isValidEmail) {
        cb(null, 'email', invalidEmail);
      } else if (!isValidDate) {
        cb(null, 'date', invalidDate);
      } else {
        cb(true, null, null);
      }
    };

    return {
      validate: validate
    };
  });
