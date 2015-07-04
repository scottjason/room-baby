'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $rootScope, $state, userApi, pubSub, localStorageService) {

  var ctrl = this;
  $scope.user = {};

  this.registerEvents = function() {
    pubSub.on('toggleNavBar', ctrl.toggleNavBar);
    pubSub.on('toggleOverlay', ctrl.toggleOverlay);
    pubSub.on('setUser', ctrl.setUser);
    pubSub.on('timeLeft', ctrl.setTimeLeft);
  };

  this.createRoom = function() {
    pubSub.trigger('Dashboard:CreateRoom');
  };

  this.dropdown = function(opt) {
    if (opt === 'logout') {
      ctrl.logout($scope.user._id);
    }
  };

  this.setTimeLeft = function(timeLeft) {
    $rootScope.isDissconected ? ($scope.timeLeft = '') : ($scope.timeLeft = timeLeft);
  };

  this.getTimeLeft = function() {
    return $scope.timeLeft || '';
  }

  ctrl.toggleOverlay = function() {
    $scope.showOverlay = !$scope.showOverlay;
  };

  ctrl.toggleNavBar = function(_bool) {
    $scope.showNavBar = _bool;
  };

  ctrl.setUser = function(user) {
    $scope.user = user;
  };

  ctrl.logout = function(user_id) {
    localStorageService.clearAll();
    userApi.logout(user_id).then(function(response) {
      $state.go('landing');
    });
  };

  NavBarCtrl.$inject['$scope', '$rootScope', '$state', 'userApi', 'pubSub', 'localStorageService'];
}
