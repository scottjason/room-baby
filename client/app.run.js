'use strict';

angular.module('RoomBaby')
  .run(["TimeService", function(TimeService) {
  	TimeService.checkExpiration();
  }]);
