'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, Validator, StateService, ConstantService, DeviceService, UserApi, PubSub, Animator, localStorageService) {

  var ctrl = this;
  $scope.overlay = {};

  console.log('RootScope', $rootScope)
  if ($rootScope.isDisabled) {
    $scope.isEnabled = false;
    $scope.isDisabled = true;
  }

  $rootScope.$on('isDisabled', function() {
    console.log('Landing Ctrl, isDisabled');
    $timeout(function() {
      $scope.isEnabled = false;
      $scope.isDisabled = true;
    });
  });

  $rootScope.$on('isEnabled', function() {
    console.log('Landing Ctrl, isEnabled');
    $timeout(function() {
      $scope.isDisabled = false;
      $rootScope.isDisabled = false;
      $scope.isEnabled = true;
    });
  });

  this.openOverlay = function() {
    console.log('Landing Ctrl, openOverlay');
    $rootScope.$broadcast('hideNavBar');
    $scope.showOverlay = true;
    $timeout(function() {
      $scope.overlay.slideUpIn = true;
      $timeout(function() {
        $scope.overlay.expand = true;
        $timeout(function() {
          $scope.showBody = true;
        }, 250);
      }, 200);
    }, 20);
  };

  this.closeOverlay = function() {
    $scope.overlay.expand = false;
    $scope.overlay.slideUpIn = false;
    $scope.showOverlay = false;
    $scope.showBody = false;
    $scope.showOverlay = false;
  };

  this.isMobile = function() {
    return DeviceService.isMobile();
  };

  this.onReady = function() {
    console.log('Landing Ctrl, onReady');
    PubSub.trigger('toggleOverflow', null);
    PubSub.on('enterBtn:forgotPassword', this.onForgotPassword);
    StateService.data['Controllers'].Landing.isReady = true;
  };

  this.isAuthenticated = function() {
    console.log('Landing Ctrl, isAuthenticated');
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {
        var accessOpts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        localStorageService.clearAll();
        ctrl.initialize();
      } else {
        localStorageService.clearAll();
        ctrl.initialize();
      }
    }, function(err) {
      localStorageService.clearAll();
      ctrl.initialize();
    });
  };

  this.getState = function() {
    console.log('Landing Ctrl, getState');

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
    $scope.showErr = null;
    $scope.errMessage = '';
    console.log('optSelected', optSelected);
    $scope.user = {};
    if (optSelected === 'login') {
      $scope.showRegister = false;
      $scope.showLogin = true;
      var hasAnimated = StateService.data['Animator']['login'].hasAnimated;
      if (!hasAnimated) {
        StateService.data['Animator']['login'].hasAnimated = true;
        var opts = Animator.generateOpts('onLogin');
        Animator.run(opts);
        $timeout(function() {
          var elem = angular.element(document.getElementById('login-input-email'));
          elem.focus();
        }, 200);
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
          $scope.showLoader = true;
          ctrl.login(opts);
        } else {
          $scope.showErr = true;
          $scope.errMessage = errMessage;
          $timeout(function() {
            $scope.showErr = false;
            $scope.errMessage = '';
            var elem = (badInput !== 'password') ? angular.element(document.getElementById('login-input-email')) : angular.element(document.getElementById('login-input-password'));
            elem.focus();
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
          $scope.showLoader = true;
          UserApi.resetPassword($scope.user).then(function(response) {
            $scope.showLoader = false;
            if (response.status === 401) {
              ctrl.renderError(response.data);
            } else {
              $scope.resetMessage = response.data;
            }
          });
        }
      });
    } else {
      $scope.showForgotPassword = false;
      ctrl.initialize();
    }
  };

  ctrl.initialize = function() {
    console.log('init called');
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
    console.log('reset called', refreshPage);
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
    console.log('login', opts);
    UserApi.login(opts).then(function(response) {
      if (response.status == 200) {
        localStorageService.set('user', response.data.user);
        localStorageService.set('sessions', response.data.sessions || []);
        localStorageService.set('archives', response.data.archives || []);
        var accessOpts = UserApi.generateOpts(response.data.user);
        $scope.showLoader = false;
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        console.log('status', 401);
        $scope.showLoader = false;
        $scope.user = {};
        angular.element(document.getElementById('login-input-email'))
        ctrl.renderError(response.data.message)
      } else {
        $scope.showLoader = false;
        ctrl.reset(true);
      }
    }, function(err) {
      $scope.showLoader = false;
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
