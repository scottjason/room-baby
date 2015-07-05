angular.module('RoomBaby')
  .factory('Validator', function(ConstantService) {

    var invalidUserName = ConstantService.generateError('invalidUserName');
    var invalidEmail = ConstantService.generateError('invalidEmail');
    var invalidPassword = ConstantService.generateError('invalidPassword');
    var invalidTitle = ConstantService.generateError('invalidTitle');
    var dateReset = ConstantService.generateError('dateReset');

    var userNameRegEx = /^([a-zA-Z0-9_-]){3,8}$/;
    var emailRegEx = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    function validate(obj, callback) {
      if (obj.type === 'login') {
        validateLogin(obj, callback);
      } else if (obj.type === 'register') {
        validateRegistration(obj, callback);
      } else if (obj.type === 'email') {
        validateEmail(obj.email, callback);
      }
    }

    function validateEmail(guestEmail, callback) {
      var isValidEmail = emailRegEx.test(guestEmail);
      if (!isValidEmail) return callback(null);
      callback(true);
    }

    function validateLogin(obj, callback) {
      var validEmail = emailRegEx.test(obj.email);
      var validPassword = (obj.password && (obj.password.length >= 3) && (obj.password.length <= 50));
      if (!validEmail) {
        callback(null, 'email', invalidEmail);
      } else if (!validPassword) {
        callback(null, 'password', invalidPassword);
      } else {
        callback(true, null, null);
      }
    }

    function validateRegistration(obj, callback) {
      var validUserName = userNameRegEx.test(obj.username);
      var validEmail = emailRegEx.test(obj.email);
      var validPassword = (obj.password && (obj.password.length >= 3) && (obj.password.length <= 50));

      if (!validUserName) {
        callback(null, 'username', invalidUserName);
      } else if (!validEmail) {
        callback(null, 'email', invalidEmail);
      } else if (!validPassword) {
        callback(null, 'password', invalidPassword);
      } else {
        callback(true, null, null);
      }
    }

    function validateInvite(obj, callback) {
      var isValidTitle = ((obj.title.length >= 3) && (obj.title.length <= 26));
      var isValidEmail = emailRegEx.test(obj.guestEmail);
      var isValidDate = (obj.startsAt.length);

      if (!isValidTitle) {
        callback(null, 'title', invalidTitle);
      } else if (!isValidEmail) {
        callback(null, 'email', invalidEmail);
      } else if (!isValidDate) {
        callback(null, 'date', invalidDate);
      } else {
        callback(true, null, null);
      }
    }

    function generateOpts(type, data) {
      var opts = {};
      if (type === 'email') {
        opts.type = type;
        opts.email = data;
      } else if (type === 'register' || type === 'login') {
        opts = data;
        opts.type = type;
      }
      return opts;
    }

    return {
      validate: validate,
      generateOpts: generateOpts
    };
    Validator.$inject('ConstantService');
  });
