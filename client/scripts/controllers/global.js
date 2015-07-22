'use strict';

angular.module('RoomBaby')
  .controller('GlobalCtrl', GlobalCtrl);

function GlobalCtrl($scope, PubSub, DeviceService) {

  $scope.isMobile = function() {
    // return DeviceService.isMobile();
  };

  $scope.registerEvents = function() {
    PubSub.on('toggleOverflow', function(_bool) {
      $scope.showOverflow = _bool;
    });
  };
  GlobalCtrl.$inject['$scope', 'PubSub', 'DeviceService'];
}
