'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $state, $window, $timeout, Validator, StateService, ConstantService, DeviceService, UserApi, PubSub, Animator, localStorageService) {

  var ctrl = this;

  this.registerEvents = function() {
    PubSub.on('enterBtn:onLogin', ctrl.validateLogin);
    PubSub.on('enterBtn:onRegister', ctrl.validateRegistration);
    StateService.data['Controllers'].Landing.isReady = true;
  };

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {
        var opts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(opts);
      } else if (response.status === 401) {
        localStorageService.clearAll();
        ctrl.initialize();
      } else {
        localStorageService.clearAll()
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }
    }, function(err) {
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  this.getState = function() {
    function getState() {
      var isFooterReady = StateService.data['Controllers'].Footer.isReady;
      var isNavReady = StateService.data['Controllers'].Navbar.isReady;
      if (isFooterReady && isNavReady) {
        PubSub.trigger('toggleNavBar', false);
        PubSub.trigger('toggleFooter', false);
      } else {
        $timeout(getState, 200);
      }
    }
    getState();
  };

  this.onOptSelected = function(optSelected) {
    $scope.user = {};
    if (optSelected === 'login') {
      $scope.showRegister = false;
      $scope.showLogin = true;
      var hasAnimated = StateService.data['Animator']['login'].hasAnimated;
      if (!hasAnimated) {
        StateService.data['Animator']['login'].hasAnimated = true;
        var opts = Animator.generateOpts('onLogin');
        Animator.run(opts);
      }
    } else if (optSelected === 'register') {
      $scope.showLogin = false;
      $scope.showRegister = true;
      var hasAnimated = StateService.data['Animator']['register'].hasAnimated;
      if (!hasAnimated) {
        StateService.data['Animator']['register'].hasAnimated = true;
        var opts = Animator.generateOpts('onRegister');
        Animator.run(opts);
      }
    } else if (optSelected === 'facebook') {
      localStorageService.set('isFacebookLogin', true);
      $window.location.href = $window.location.protocol + '//' + $window.location.host + $window.location.pathname + 'auth/facebook';
    } else if (optSelected === 'forgotPassword') {
      $scope.showForgotPassword = true;
    } else if (optSelected === 'roomBaby') {
      localStorageService.clearAll();
      $state.go($state.current, {}, {
        reload: true
      });
    }
  };

  this.validateLogin = function() {
    var opts = Validator.generateOpts('login', $scope.user);
    Validator.validate(opts, function(isValid, badInput, errMessage) {
      if (isValid) {
        ctrl.login(opts);
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

  this.validateRegistration = function() {

    var twoSeconds = 2000;
    var currentMsUtc = new Date().getTime();

    $scope.lastClick = $scope.lastClick ? $scope.thisClick : currentMsUtc;
    $scope.thisClick = currentMsUtc;

    var lastClickedAt = ($scope.thisClick - $scope.lastClick);
    var isInititalAttempt = !lastClickedAt;
    var isDoubleRegister = (lastClickedAt < twoSeconds);

    if (isInititalAttempt || (!isInititalAttempt && !isDoubleRegister)) {
      var opts = Validator.generateOpts('register', $scope.user);
      Validator.validate(opts, function(isValid, badInput, errMessage) {
        if (isValid) {
          ctrl.register(opts);
        } else {
          $scope.user[badInput] = '';
          $scope.showErr = true;
          $scope.errMessage = errMessage;
          $timeout(function() {
            $scope.showErr = null;
            $scope.errMessage = '';
          }, 2000);
          ($scope.$parent.$$phase === '$apply') ? null: $scope.$apply();
        }
      });
    }
  };

  this.onForgotPassword = function(isCanceled) {
    if (!isCanceled) {
      var opts = Validator.generateOpts('email', $scope.user.email);
      Validator.validate(opts, function(isValid) {
        if (!isValid) {
          var errMessage = ConstantService.generateError('invalidEmail');
          ctrl.renderError(errMessage);
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
  };

  ctrl.initialize = function() {
    $scope.showRegister = false;
    $scope.showLogin = false;
    $scope.showLanding = true;
    var hasAnimated = StateService.data['Animator']['landing'].hasAnimated;
    if (hasAnimated) {
      var opts = Animator.generateOpts('onLanding', true);
      Animator.run(opts);
    } else {
      StateService.data['Animator']['landing'].hasAnimated = true;
      var opts = Animator.generateOpts('onLanding', null);
      Animator.run(opts);
    }
  };

  ctrl.login = function(opts) {
    UserApi.login(opts).then(function(response) {
      if (response.status == 200) {
        localStorageService.set('user', response.data.user);
        localStorageService.set('sessions', response.data.sessions);
        localStorageService.set('archives', response.data.archives);
        var opts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(opts);
      } else if (response.status === 401) {
        ctrl.renderError(response.data.message)
      } else {
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }
    }, function(err) {
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  ctrl.register = function(opts) {
    UserApi.register(opts).then(function(response) {
      if (response.status === 401) {
        ctrl.renderError(response.data.message);
      } else if (!response.data.session) {
        var user = response.data.user;
        var opts = {
          user_id: user._id
        }
        localStorageService.set('user', user);
        ctrl.grantAccess(opts);
      } else {
        var user = response.data.user;
        var session = response.data.sessions;
        var opts = {
          user_id: user._id
        }
        localStorageService.set('sessions', sessions);
        localStorageService.set('user', user);
        ctrl.grantAccess(opts);
      }
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.grantAccess = function(opts) {
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

  LandingCtrl.$inject['$scope', '$state', '$window', '$timeout', 'Validator', 'StateService', 'ConstantService', 'DeviceService', 'UserApi', 'PubSub', 'Animator', 'localStorageService'];
};
