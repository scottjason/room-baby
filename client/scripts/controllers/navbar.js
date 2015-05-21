'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $state, UserApi, PubSub, localStorageService) {

  var vm = this;

  $scope.showNavBar = null;
  $scope.user = {};

  this.registerEvents = function() {
    PubSub.on('toggleNavBar', function(_bool) {
      $scope.showNavBar = _bool;
    });

    PubSub.on('setUser', function(user) {
      $scope.user = user;
    });
  };

  this.faq = function() {
    console.log('faq');
  };

  this.dropdown = function(opt) {
    if (opt === 'logout') {
      vm.logout($scope.user._id);
    }
  };


  this.createRoom = function() {
    PubSub.trigger('Dashboard:CreateRoom');
  };

  vm.logout = function(user_id) {
    localStorageService.clearAll();
    UserApi.logout(user_id).then(function(response) {
      $state.go('landing');
    });
  };

  NavBarCtrl.$inject['$scope', '$state', 'UserApi', 'PubSub', 'localStorageService'];
}
