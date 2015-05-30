'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, UserApi, PubSub, Animation, localStorageService) {

  var vm = this;
  var cleanForm = { email: '', password: '' };
  $scope.user = {};

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        }
        vm.accessGranted(opts);
      } else if (response.status === 200) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        var opts = {
          user_id: user._id
        }
        vm.accessGranted(opts);
      } else if (response.status === 401) {
        vm.init();
        PubSub.trigger('toggleNavBar', null);
        PubSub.trigger('toggleFooter', null);
      } else {
        console.error('unknown authentication status');
      }
    }, function(err) {
      console.error(err);
    });
  };

  this.selectedOpt = function(optSelected) {
    if (optSelected === 'login') {
      $scope.learnMore = null;
      $scope.showRegister = null;
      $scope.showLogin = true;
    } else if (optSelected === 'register') {
      $scope.learnMore = null;
      $scope.showLogin = null;
      $scope.showRegister = true;
    } else if (optSelected === 'facebook') {
      localStorageService.set('isFacebookLogin', true);
      $window.location = $window.location.protocol + '//' + $window.location.host + $window.location.pathname + 'auth/facebook';
    } else {
      $scope.learnMore = true;
    }
  };

  this.submitForm = function(type) {
    if (type === 'login') {
      $scope.payload = angular.copy($scope.user);
      $scope.user = angular.copy(cleanForm);
      $scope.authForm.$setPristine();
      vm.login();
    } else if (type === 'register') {
      $scope.payload = angular.copy($scope.user);
      $scope.user = angular.copy(cleanForm);
      $scope.authForm.$setPristine();
      vm.register();
    }
  };

  this.goBack = function() {
    $scope.learnMore = null;
    $scope.showLogin = null;
    $scope.showRegister = null;
  };

  vm.init = function() {
    $scope.showLanding = true;
    Animation.run('onLanding');
    Tipped.create('#facebook', 'login with facebook');
    Tipped.create('#login', 'login with your email');
    Tipped.create('#register', 'create an account');
    Tipped.create('#learn', 'how this works');
  };

  vm.login = function() {
    UserApi.login($scope.payload).then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        };
        vm.accessGranted(opts);
      } else if (response.status === 200 && response.data.sessions) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        var opts = {
          user_id: user._id
        };
        vm.accessGranted(opts);
      } else if (response.status === 401) {
        vm.renderError(response.data.message)
      } else {
        vm.renderError('unknown response on login');
      }
    }, function(err) {
      console.log(err);
    });
  };

  vm.register = function() {
    UserApi.register($scope.payload).then(function(response) {
      if (response.status === 401) {
        vm.renderError(response.data.message);
      } else if (!response.data.session) {
        var user = response.data.user;
        localStorageService.set('user', user);
        vm.accessGranted(user)
      }
    }, function(err) {
      console.log(err);
    });
  };

  vm.accessGranted = function(opts) {
    $scope.showLanding = false;
    $state.go('dashboard', opts);
  };

  vm.renderError = function(errMessage) {
    $scope.errMessage = errMessage;
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', 'UserApi', 'PubSub', 'Animation', 'localStorageService'];
};
