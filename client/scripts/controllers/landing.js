'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $timeout, $window, Authenticator, UserApi, PubSub, Animation, localStorageService) {

  var vm = this;
  var expirationTime = moment(new Date()).add(1, 'hours');
  var cleanForm = { email: '', password: '' };
  $scope.user = {};


  this.isAuthenticated = function() {
    if (Authenticator.isAuthenticated() && localStorageService.get('user')) {
      console.log('landing.js : user already authenticated, redirecting to dashboard');
      var user_id = localStorageService.get('user')._id;
      var opts = {
        user_id: user_id
      };
      vm.accessGranted(opts);
    } else {
      init();
      UserApi.isAuthenticated().then(function(response) {
        if (response.status === 200 && !response.data.session) {
          console.log('landing.js has user .. granting access');
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
  };

  function init() {
    Animation.run('onLanding');
    Tipped.create('#facebook', 'login with facebook');
    Tipped.create('#login', 'login with your email');
    Tipped.create('#register', 'create an account');
    Tipped.create('#learn', 'how this works');
    Authenticator.clearAll();
  };

  this.selectedOpt = function(optSelected) {
    console.log('selectedOpt', optSelected);
    if (optSelected === 'login') {
      $scope.learnMore = null;
      $scope.showRegister = null;
      $scope.showLogin = true;
    } else if (optSelected === 'register') {
      $scope.learnMore = null;
      $scope.showLogin = null;
      $scope.showRegister = true;
    } else if (optSelected === 'facebook') {
      Authenticator.authenticate(expirationTime);
      Authenticator.setLogin('facebook');
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
    Authenticator.authenticate(expirationTime);
    $state.go('dashboard', opts);
  };

  vm.renderError = function(errMessage) {
    $scope.errMessage = errMessage;
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'Authenticator', 'UserApi', 'PubSub', 'Animation', 'localStorageService'];
};
