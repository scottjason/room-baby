'use strict';

angular.module('RoomBaby')
  .run(['$rootScope', '$window', function($rootScope, $window) {
    if ($window.innerWidth <= 900) {
      $rootScope.isDisabled = true;
    }
  }]);
