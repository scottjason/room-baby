'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, Validator, StateService, DeviceService, UserApi, PubSub, Animator, localStorageService) {

  var ctrl = this;

  this.registerEvents = function() {
    PubSub.on('enterBtn:onLogin', ctrl.onLogin);
    PubSub.on('enterBtn:onRegister', ctrl.onRegister);
    PubSub.trigger('toggleNavBar', false);
    PubSub.trigger('toggleFooter', false);
  };

  this.isAuthenticated = function() {
    var isMobile = DeviceService.isMobile();
    console.log(isMobile);
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        };
        ctrl.grantAccess(opts);
      } else if (response.status === 200) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        var opts = {
          user_id: user._id
        };
        ctrl.grantAccess(opts);
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
        Animator.run(obj);
        $scope.hasAnimatedLogin = true;
      }
    } else if (optSelected === 'register') {
      $scope.showLogin = false;
      $scope.showRegister = true;
      if (!$scope.hasAnimatedRegister) {
        obj.type = 'onRegister';
        Animator.run(obj);
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
    Validator.validate(payload, function(isValid, badInput, errMessage) {
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

    var twoSeconds = 2000;
    var currentMsUtc = new Date().getTime();

    $scope.lastClick ? ($scope.lastClick = $scope.thisClick) : ($scope.lastClick = currentMsUtc);
    $scope.thisClick = currentMsUtc;

    var lastClickedAt = ($scope.thisClick - $scope.lastClick);
    var isInititalAttempt = !lastClickedAt;

    if (!isInititalAttempt) {
      var isDoubleRegister = (lastClickedAt < twoSeconds);
      isDoubleRegister ? null : ctrl.validateRegistration();
    } else {
      ctrl.validateRegistration();
    }
  };

  ctrl.validateRegistration = function() {
    var payload = angular.copy($scope.user);
    payload.type = 'register';
    console.log('payload', payload);
    Validator.validate(payload, function(isValid, badInput, errMessage) {
      if (isValid) {
        ctrl.register(payload);
      } else {
        $scope.user[badInput] = '';
        $scope.showErr = true;
        $scope.errMessage = errMessage;
        $timeout(function() {
          $scope.showErr = null;
          $scope.errMessage = '';
        }, 2000);
        var isApplying = ($scope.$parent.$$phase === '$apply');
        isApplying ? null : $scope.$apply();
      }
    });
  };

  this.onForgotPassword = function(isCanceled) {
    if (!isCanceled) {
      var obj = {};
      obj.type = 'email';
      obj.email = $scope.user.email;
      Validator.validate(obj, function(isValid) {
        if (!isValid) {
          ctrl.renderError('please enter a valid email');
        } else {
          UserApi.resetPassword($scope.user).then(function(response) {
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
    var runLanding = StateService.data['animation'].runLanding;
    if (!runLanding) {
      var obj = {};
      obj.type = 'onLanding';
      obj.hasAnimated = true;
      Animator.run(obj);
    } else {
      var obj = {};
      obj.type = 'onLanding';
      obj.hasAnimated = false;
      Animator.run(obj);
      StateService.data['animation'].runLanding = false;
    }
  };

  ctrl.login = function(payload) {
    UserApi.login(payload).then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        };
        ctrl.grantAccess(opts);
      } else if (response.status === 200 && response.data.sessions) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        var opts = {
          user_id: user._id
        };
        ctrl.grantAccess(opts);
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
    console.log('hit ctrl register');
    return;
    UserApi.register(payload).then(function(response) {
      if (response.status === 401) {
        ctrl.renderError(response.data.message);
      } else if (!response.data.session) {
        var user = response.data.user;
        localStorageService.set('user', user);
        ctrl.grantAccess(user);
      } else {
        var user = response.data.user;
        var session = response.data.sessions;
        localStorageService.set('sessions', sessions);
        localStorageService.set('user', user);
        ctrl.grantAccess(user);
      }
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.grantAccess = function(opts) {
    $scope.showLanding = false;
    $state.go('dashboard', opts);
  };

  ctrl.renderError = function(errMessage) {
    $scope.showErr = true;
    $scope.errMessage = errMessage;
    $timeout(function() {
      $scope.errMessage = '';
      $scope.showErr = false;
    }, 2000);
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'Validator', 'StateService', 'DeviceService', 'UserApi', 'PubSub', 'Animator', 'localStorageService'];
};
