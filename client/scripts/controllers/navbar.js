'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $state, UserApi, PubSub, localStorageService) {

  var ctrl = this;
  $scope.user = {};

  this.registerEvents = function() {

    PubSub.on('toggleOverlay', function() {
      $scope.showOverlay = !$scope.showOverlay;
    });

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
      ctrl.logout($scope.user._id);
    }
  };

  this.createRoom = function() {
    PubSub.trigger('Dashboard:CreateRoom');
  };

  ctrl.logout = function(user_id) {
    localStorageService.clearAll();
    UserApi.logout(user_id).then(function(response) {
      $state.go('landing');
    });
  };

  NavBarCtrl.$inject['$scope', '$state', 'UserApi', 'PubSub', 'localStorageService'];
}
