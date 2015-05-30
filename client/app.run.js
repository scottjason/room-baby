'use strict';

angular.module('RoomBaby')
  .run(["$stateParams", "$rootScope", "$state", "$location", function($stateParams, $rootScope, $state, $location) {
  	console.log('run block');
    $rootScope.$broadcast('registerEvents');
  }]);
