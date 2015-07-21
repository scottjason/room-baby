'use strict';

angular.module('RoomBaby')
  .controller('WorksCtrl', WorksCtrl);

function WorksCtrl($scope, $rootScope, $timeout, PubSub, SessionApi, Animator, StateService, localStorageService) {

  var ctrl = this;

  console.log('how this works controller');


  WorksCtrl.$inject['$scope', '$rootScope', '$timeout', 'PubSub', 'SessionApi', 'Animator', 'StateService', 'localStorageService'];
}
