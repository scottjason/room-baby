'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $rootScope, $state, UserApi, PubSub, localStorageService) {

  var ctrl = this;

  this.registerEvents = function() {
    PubSub.on('toggleNavBar', ctrl.toggleNavBar);
    PubSub.on('toggleOverlay', ctrl.toggleOverlay);
    PubSub.on('setUser', ctrl.setUser);
    PubSub.on('timeLeft', ctrl.setTimeLeft);
  };

  this.createRoom = function() {
    PubSub.trigger('Dashboard:CreateRoom');
  };

  this.dropdown = function(opt) {
    if (opt === 'logout') {
      ctrl.logout($scope.user._id);
    }
  };

  this.setTimeLeft = function(timeLeft) {
    $scope.timeLeft = ($rootScope.isDissconected || timeLeft === '0 minutes and 0 seconds left') ? '' : timeLeft;
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
    UserApi.logout(user_id).then(function(response) {
      $state.go('landing');
    });
  };

  NavBarCtrl.$inject['$scope', '$rootScope', '$state', 'UserApi', 'PubSub', 'localStorageService'];
}
