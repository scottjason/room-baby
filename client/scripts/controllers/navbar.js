'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $state, userApi, pubSub, localStorageService) {

  var ctrl = this;
  $scope.user = {};

  this.registerEvents = function() {
    pubSub.on('toggleNavBar', ctrl.toggleNavBar);
    pubSub.on('toggleOverlay', ctrl.toggleOverlay);
    pubSub.on('setUser', ctrl.setUser);
  };

  this.createRoom = function() {
    pubSub.trigger('Dashboard:CreateRoom');
  };

  this.dropdown = function(opt) {
    if (opt === 'logout') {
      ctrl.logout($scope.user._id);
    }
  };

  ctrl.toggleOverlay = function() {
    $scope.showOverlay = !$scope.showOverlay;
  };

  ctrl.toggleNavBar = function(_bool) {
    $scope.showNavBar = _bool;
  };

  ctrl.setUser = function (user) {
   $scope.user = user;
  };

  ctrl.logout = function(user_id) {
    localStorageService.clearAll();
    userApi.logout(user_id).then(function(response) {
      $state.go('landing');
    });
  };

  NavBarCtrl.$inject['$scope', '$state', 'userApi', 'pubSub', 'localStorageService'];
}
