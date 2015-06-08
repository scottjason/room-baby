'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, socket, validator, stateService, userApi, pubSub, animator, localStorageService) {

  var ctrl = this;

  socket.on('connected', function() {
    console.log('Socket.io Successfuly Connected');
  });

  this.registerEvents = function() {
    pubSub.on('enterBtn:onLogin', ctrl.onLogin);
    pubSub.on('enterBtn:onRegister', ctrl.onRegister);
  };

  this.isAuthenticated = function() {
    userApi.isAuthenticated().then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        };
        ctrl.accessGranted(opts);
      } else if (response.status === 200) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        var opts = {
          user_id: user._id
        };
        ctrl.accessGranted(opts);
      } else if (response.status === 401) {
        console.log('response 401', response);
        pubSub.trigger('toggleNavBar', null);
        pubSub.trigger('toggleFooter', null);
        ctrl.initialize();
      } else {
        console.error('unknown authentication status');
      }
    }, function(err) {
      console.error(err);
    });
  };

  this.selectedOpt = function(optSelected) {
    $scope.user = {};
    var obj = {};
    if (optSelected === 'login') {
      $scope.showRegister = null;
      $scope.showLogin = true;
      obj.type = 'onLogin';
      animator.run(obj);
    } else if (optSelected === 'register') {
      console.log('register');
      $scope.showLogin = null;
      $scope.showRegister = true;
      obj.type = 'onRegister';
      animator.run(obj);
    } else if (optSelected === 'facebook') {
      localStorageService.set('isFacebookLogin', true);
      $window.location = $window.location.protocol + '//' + $window.location.host + $window.location.pathname + 'auth/facebook';
    } else if (optSelected === 'back') {
      document.getElementById('register-copy').style.display = 'none';
      $scope.showLogin = null;
      $scope.showRegister = null;
    } else if (optSelected === 'forgotPassword') {
      console.log('forgotPassword');
    } else if (optSelected === 'roomBaby') {
      $state.go($state.current, {}, {
        reload: true
      });
    }
  };

  this.onLogin = function() {
    var payload = angular.copy($scope.user);
    payload.type = 'login';
    validator.validate(payload, function(isValid, badInput, errMessage) {
      if (isValid) {
        $scope.user = {};
        ctrl.login(payload);
      } else {
        $scope.user[badInput] = '';
        $scope.showErr = true;
        $scope.errMessage = errMessage;
        $timeout(function() {
          $scope.showErr = null;
        }, 2000);
      }
    });
  };

  this.onRegister = function() {
    console.log('onRegister')
    var payload = angular.copy($scope.user);
    payload.type = 'register';
    validator.validate(payload, function(isValid, badInput, errMessage) {
      console.log('isValid', isValid);
      console.log('badInput', badInput);
      console.log('err', errMessage);
      if (isValid) {
        $scope.user = {};
        ctrl.register(payload);
      } else {
        $scope.user[badInput] = '';
        $scope.showErr = true;
        $scope.errMessage = errMessage;
        $timeout(function() {
          $scope.showErr = null;
        }, 2000);
      }
    });
  };

  ctrl.initialize = function() {
    $scope.showRegister = null;
    $scope.showLogin = null;
    $scope.showLanding = true;
    var runLanding = stateService.data['animation'].runLanding;
    if (!runLanding) {
      var obj = {};
      obj.type = 'onLanding';
      obj.hasAnimated = true;
      animator.run(obj);
    } else {
      var obj = {};
      obj.type = 'onLanding';
      obj.hasAnimated = false;
      animator.run(obj);
      stateService.data['animation'].runLanding = false;
    }
  };

  ctrl.login = function(payload) {
    userApi.login(payload).then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        };
        ctrl.accessGranted(opts);
      } else if (response.status === 200 && response.data.sessions) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        var opts = {
          user_id: user._id
        };
        ctrl.accessGranted(opts);
      } else if (response.status === 401) {
        ctrl.renderError(response.data.message)
      } else {
        ctrl.renderError('unknown response on login');
      }
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.register = function(payload) {
    userApi.register(payload).then(function(response) {
      if (response.status === 401) {
        ctrl.renderError(response.data.message);
      } else if (!response.data.session) {
        var user = response.data.user;
        localStorageService.set('user', user);
        ctrl.accessGranted(user)
      }
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.accessGranted = function(opts) {
    $scope.showLanding = false;
    $state.go('dashboard', opts);
  };

  ctrl.renderError = function(errMessage) {
    $scope.showErr = true;
    $scope.errMessage = errMessage;
    $timeout(function() {
      $scope.showErr = null;
    }, 2000);
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'socket', 'validator', 'stateService', 'userApi', 'pubSub', 'animator', 'localStorageService'];
};
