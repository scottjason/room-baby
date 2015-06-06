'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, socket, validator, ngDialog, UserApi, PubSub, Animation, localStorageService) {

  var ctrl = this;

  socket.on('connected', function() {
    console.log('Socket.io Successfuly Connected');
  });

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
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
