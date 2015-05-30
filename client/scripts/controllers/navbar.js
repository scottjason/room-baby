'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $state, UserApi, PubSub, localStorageService) {

  var vm = this;
  $scope.user = {};

  this.registerEvents = function() {
    PubSub.on('toggleNavBar', function(_bool) {
      $scope.showNavBar = _bool;
    });

    PubSub.on('setUser', function(user) {
      if (!user.profileImage) {
        user.profileImage = 'https://raw.githubusercontent.com/scottjason/room-baby/master/client/assets/img/image-default-one.jpg';
      }
      $scope.user = user;
    });
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
