'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, socket, validator, ngDialog, UserApi, PubSub, Animation, localStorageService) {

  var ctrl = this;
  var cleanForm = { username: '', email: '', password: '' };

  socket.on('connected', function() {
    console.log('Socket.io Successfuly Connected');
  });

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = { user_id: user._id };
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
        PubSub.trigger('toggleNavBar', null);
        PubSub.trigger('toggleFooter', null);
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
    if (optSelected === 'login') {
      $scope.showRegister = null;
      $scope.showLogin = true;
    } else if (optSelected === 'register') {
      $scope.showLogin = null;
      $scope.showRegister = true;
    } else if (optSelected === 'facebook') {
      localStorageService.set('isFacebookLogin', true);
      $window.location = $window.location.protocol + '//' + $window.location.host + $window.location.pathname + 'auth/facebook';
    } else if (optSelected === 'back') {
      $scope.showLogin = null;
      $scope.showRegister = null;
    }
  };

  this.onLogin = function() {
    var payload = angular.copy($scope.user);
    $scope.user = angular.copy(cleanForm);
    $scope.authForm.$setPristine();
    validator.validateLogin(payload, function(type, isValid) {
      if (isValid) {
        ctrl.login(payload);
      } else if (type === 'email') {
        $scope.showErr = true;
        $scope.errMessage = 'please enter a valid email';
        $timeout(function() {
          $scope.showErr = null;
        }, 2400);
      }
    });
  };

  this.onRegister = function() {
    var payload = angular.copy($scope.user);
    $scope.user = angular.copy(cleanForm);
    $scope.authForm.$setPristine();
    validator.validateRegister(payload, function(type, isValid) {
      if (isValid) {
        ctrl.register(payload);
      } else if (type === 'username') {
        $scope.showErr = true;
        $scope.errMessage = 'please enter a valid username, three to eight characters';
        $timeout(function() {
          $scope.showErr = null;
        }, 2400);
      } else if (type === 'email') {
        $scope.showErr = true;
        $scope.errMessage = 'please enter a valid email';
        $timeout(function() {
          $scope.showErr = null;
        }, 2400);
      }
    });
  };

  ctrl.initialize = function() {
    $scope.showRegister = null;
    $scope.showLogin = null;
    $scope.showLanding = true;
    Animation.run('onLanding');
  };

  ctrl.login = function(payload) {
    UserApi.login(payload).then(function(response) {
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

  ctrl.openRegister = function() {
    ngDialog.openConfirm({
      template: '../../views/ngDialog/register.html',
      controller: 'FooterCtrl'
    });
  };

  ctrl.register = function(payload) {
    UserApi.register(payload).then(function(response) {
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
    $scope.errMessage = errMessage;
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'socket', 'validator', 'ngDialog', 'UserApi', 'PubSub', 'Animation', 'localStorageService'];
};
