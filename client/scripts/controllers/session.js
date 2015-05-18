'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', function($scope) {
    $scope.init = function() {
      console.log('hello session');
    }
  });
