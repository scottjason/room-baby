'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, socket, ngDialog, UserApi, PubSub, Animation, localStorageService) {

  var ctrl = this;
  var cleanForm = { email: '', password: '' };
  $scope.user = {};

  socket.on('connected', function () {
    console.log('Socket.io Successfuly Connected');
  });

  socket.emit('getVideoStatus');

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
        var opts = { user_id: user._id };
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
    if (optSelected === 'login') {
      $scope.showRegister = null;
      $scope.showLogin = true;
    } else if (optSelected === 'facebook') {
      localStorageService.set('isFacebookLogin', true);
      $window.location = $window.location.protocol + '//' + $window.location.host + $window.location.pathname + 'auth/facebook';
    } else {
      $scope.learnMore = true;
    }
  };

  this.submitForm = function(type) {
    if (type === 'login') {
      var payload = angular.copy($scope.user);
      $scope.user = angular.copy(cleanForm);
      $scope.authForm.$setPristine();
      ctrl.login(payload);
    } else if (type === 'register') {
      var payload = angular.copy($scope.user);
      $scope.user = angular.copy(cleanForm);
      $scope.authForm.$setPristine();
      ctrl.register(payload);
    }
  };

  this.goBack = function() {
    $scope.learnMore = null;
    $scope.showLogin = null;
    $scope.showRegister = null;
  };

  ctrl.initialize = function() {
    $scope.showLanding = true;
    Animation.run('onLanding');
    // Tipped.create('#facebook', 'login with facebook');
    // Tipped.create('#login', 'login with your email');
    // Tipped.create('#register', 'create an account');
    // Tipped.create('#learn', 'how this works');
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

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'socket', 'ngDialog', 'UserApi', 'PubSub', 'Animation', 'localStorageService'];
};
