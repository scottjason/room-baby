'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, socket, validator, stateService, userApi, pubSub, animator, localStorageService) {

  var ctrl = this;

  socket.on('connected', function() {});


  this.registerEvents = function() {
    pubSub.on('enterBtn:onLogin', ctrl.onLogin);
    pubSub.on('enterBtn:onRegister', ctrl.onRegister);
    pubSub.trigger('toggleNavBar', false);
    pubSub.trigger('toggleFooter', false);
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
        localStorageService.clearAll()
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
      $scope.showRegister = false;
      $scope.showLogin = true;
      if (!$scope.hasAnimatedLogin) {
        obj.type = 'onLogin';
        animator.run(obj);
        $scope.hasAnimatedLogin = true;
      }
    } else if (optSelected === 'register') {
      $scope.showLogin = false;
      $scope.showRegister = true;
      if (!$scope.hasAnimatedRegister) {
        obj.type = 'onRegister';
        animator.run(obj);
        $scope.hasAnimatedRegister = true;
      }
    } else if (optSelected === 'facebook') {
      localStorageService.set('isFacebookLogin', true);
      $window.location = $window.location.protocol + '//' + $window.location.host + $window.location.pathname + 'auth/facebook';
    } else if (optSelected === 'forgotPassword') {
      $scope.showForgotPassword = true;
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
        ctrl.login(payload);
      } else {
        $scope.user[badInput] = '';
        $scope.showErr = true;
        $scope.errMessage = errMessage;
        $timeout(function() {
          $scope.errMessage = '';
          $scope.showErr = false;
        }, 2000);
      }
    });
  };

  this.onRegister = function() {
    var payload = angular.copy($scope.user);
    payload.type = 'register';
    validator.validate(payload, function(isValid, badInput, errMessage) {
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
        $scope.$apply();
      }
    });
  };

  this.onForgotPassword = function(isCanceled) {
    if (!isCanceled) {
      var obj = {};
      obj.type = 'email';
      obj.email = $scope.user.email;
      validator.validate(obj, function(isValid) {
        if (!isValid) {
          ctrl.renderError('please enter a valid email');
        } else {
          userApi.resetPassword($scope.user).then(function(response) {
            console.log('response', response);
          });
        }
      });
    } else {
      $scope.showForgotPassword = false;
      ctrl.initialize();
    }
  }

  ctrl.initialize = function() {
    $scope.showRegister = false;
    $scope.showLogin = false;
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
      $scope.showErr = false;
      $scope.errMessage = '';
    }, 2000);
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'socket', 'validator', 'stateService', 'userApi', 'pubSub', 'animator', 'localStorageService'];
};
