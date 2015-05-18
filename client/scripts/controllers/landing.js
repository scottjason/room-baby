'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $timeout, $window, $modal, UserApi, PubSub, Animation, localStorageService) {

  var vm = this;
  $scope.user = {};

  Animation.onReady();

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200 && !response.data.session) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        }
        vm.accessGranted(opts);
      } else if (response.status === 200) {
        var user = response.data.user;
        var session = response.data.session;
        localStorageService.set('user', user);
        localStorageService.set('session', session);
        var opts = {
          user_id: user._id
        }
        vm.accessGranted(opts);
      } else if (response.status === 401) {
        PubSub.trigger('toggleNavBar', null);
        PubSub.trigger('toggleFooter', null);
      } else {
        console.error('unknown authentication status');
      }
    }, function(err) {
      console.error(err);
    });
  }

  this.selectedOpt = function(optSelected) {
    if (optSelected === 'login') {
      $scope.learnMore = null;
      $scope.showRegister = null;
      $scope.showLogin = true;
    } else if (optSelected === 'register') {
      $scope.learnMore = null;
      $scope.showLogin = null;
      $scope.showRegister = true;
    } else {
      $scope.learnMore = true;
    }
  };

  this.submitForm = function(type) {
    if (type === 'login') {
      var cleanForm = {
        email: '',
        password: ''
      };
      $scope.payload = angular.copy($scope.user);
      $scope.user = angular.copy(cleanForm);
      $scope.authForm.$setPristine();
      vm.login();
    } else if (type === 'register') {
      var cleanForm = {
        email: '',
        password: ''
      };
      $scope.payload = angular.copy($scope.user);
      $scope.user = angular.copy(cleanForm);
      $scope.authForm.$setPristine();
      vm.register();
    }
  };

  this.reloadState = function() {
    $state.go($state.current, {}, {
      reload: true
    });
  };

  vm.login = function() {
    UserApi.login($scope.payload).then(function(response) {
      if (response.status === 200 && response.data.user && !response.data.session) {
        var user = response.data.user;
        localStorageService.set('user', user);
        var opts = {
          user_id: user._id
        }
        vm.accessGranted(opts)
      } else if (response.status === 200 && response.data.user && response.data.session) {
        var user = response.data.user;
        var session = response.data.session;
        localStorageService.set('user', user);
        localStorageService.set('session', session);
        var opts = {
          user_id: user._id
        }
        vm.accessGranted(opts)
      } else if (response.status === 401) {
        vm.renderError(response.data.message)
      } else {
        vm.renderError('unknown response on login');
      }
    }, function(err) {
      console.log(err);
    })
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
    })
  };

  vm.accessGranted = function(opts) {
    $state.go('dashboard', opts)
  };

  vm.renderError = function(errMessage) {
    $scope.errMessage = errMessage;
  };


  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', '$modal', 'UserApi', 'PubSub', 'Animation', 'localStorageService'];
};
