'use strict';

angular.module('RoomBaby')
  .controller('GlobalCtrl', GlobalCtrl);

function GlobalCtrl($scope, $rootScope, $state, $timeout, PubSub, StateService, localStorageService) {

  var ctrl = this;

  PubSub.on('dashboardLoaded', function(){
    $scope.addScroll = true;
    console.log('dashboardLoaded');
  });

  GlobalCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', 'PubSub', 'StateService', 'localStorageService'];
}
