'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $rootScope, $state, $window, UserApi, PubSub, localStorageService) {

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

  this.setTimeLeft = function(timeLeft, thirtySecondsLeft, twentySecondsLeft) {
    $scope.timeLeft = ($rootScope.isDissconected || timeLeft === '0 minutes and 0 seconds left') ? '' : timeLeft;
    $scope.thirtySecondsLeft = thirtySecondsLeft;
    $scope.twentySecondsLeft = twentySecondsLeft;
  };

  this.isThirtySecondsLeft = function() {
    if ($rootScope.isDissconected || $scope.twentySecondsLeft) {
      return false;
    } else {
      return $scope.thirtySecondsLeft;
    }
  };

  this.isTwentySecondsLeft = function() {
    if ($rootScope.isDissconected) {
      return false;
    } else if ($rootScope.isRecording && $scope.twentySecondsLeft) {
      $rootScope.isRecording = false;
      PubSub.trigger('stopRecording');
      return true;
    } else if ($scope.twentySecondsLeft) {
      return true;
    }
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
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  NavBarCtrl.$inject['$scope', '$rootScope', '$state', '$window', 'UserApi', 'PubSub', 'localStorageService'];
}
