'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, Validator, StateService, ConstantService, DeviceService, UserApi, PubSub, Animator, localStorageService) {

  var ctrl = this;


  this.onReady = function() {
    PubSub.trigger('toggleOverflow', null);
    PubSub.on('enterBtn:forgotPassword', this.onForgotPassword);
    StateService.data['Controllers'].Landing.isReady = true;
  };

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {
        var accessOpts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        localStorageService.clearAll();
        ctrl.initialize();
      } else {
        ctrl.reset(true);
      }
    }, function(err) {
      ctrl.reset(true);
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
      ctrl.reset();
    } else if (optSelected === 'works') {
      ctrl.onHowThisWorks();
    }
  };

  this.validateLogin = function() {
    var inProgress = StateService.data['Auth'].Login.inProgress;
    if (!inProgress) {
      StateService.data['Auth'].Login.inProgress = true;
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
            StateService.data['Auth'].Login.inProgress = false;
          }, 1200);
        }
      });
    }
  };

  this.validateRegistration = function() {
    var inProgress = StateService.data['Auth'].Registration.inProgress;
    if (!inProgress) {
      StateService.data['Auth'].Registration.inProgress = true;
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
            StateService.data['Auth'].Registration.inProgress = false;
          }, 1200);
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
          $timeout(function() {
            ctrl.renderError(errMessage);
          })
        } else {
          UserApi.resetPassword($scope.user).then(function(response) {
            $scope.resetMessage = response.data;
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

  ctrl.reset = function(refreshPage) {
    StateService.data['Animator']['login'].hasAnimated = false;
    StateService.data['Auth'].Login.inProgress = false;
    StateService.data['Auth'].Registration.inProgress = false;
    localStorageService.clearAll();
    if (!refreshPage) {
      $state.go($state.current, {}, {
        reload: true
      });
    } else {
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    }
  };

  ctrl.login = function(opts) {
    UserApi.login(opts).then(function(response) {
      if (response.status == 200) {
        localStorageService.set('user', response.data.user);
        localStorageService.set('sessions', response.data.sessions || []);
        localStorageService.set('archives', response.data.archives || []);
        var accessOpts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        $scope.user = {};
        ctrl.renderError(response.data.message)
      } else {
        ctrl.reset(true);
      }
    }, function(err) {
      ctrl.reset(true);
    });
  };

  ctrl.register = function(opts) {
    UserApi.register(opts).then(function(response) {
      if (response.status === 200) {
        localStorageService.set('user', response.data.user);
        localStorageService.set('sessions', response.data.sessions);
        localStorageService.set('archives', response.data.archives || []);
        var accessOpts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        $scope.user = {};
        ctrl.renderError(response.data.message);
      } else {
        ctrl.reset(true);
      }
    }, function(err) {
      ctrl.reset(true);
    });
  };

  ctrl.onHowThisWorks = function() {
    PubSub.trigger('toggleOverflow', true);
    $state.go('work');
  };

  ctrl.grantAccess = function(opts) {
    $scope.user = {};
    StateService.data['Auth'].Login.inProgress = false
    StateService.data['Auth'].Registration.inProgress = false
    $state.go('dashboard', opts);
  };

  ctrl.renderError = function(errMessage) {
    $scope.showErr = true;
    $scope.errMessage = errMessage;
    $timeout(function() {
      $scope.errMessage = '';
      $scope.showErr = false;
      StateService.data['Auth'].Login.inProgress = false;
      StateService.data['Auth'].Registration.inProgress = false;
    }, 1200);
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'Validator', 'StateService', 'ConstantService', 'DeviceService', 'UserApi', 'PubSub', 'Animator', 'localStorageService'];
};
