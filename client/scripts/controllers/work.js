'use strict';

angular.module('RoomBaby')
  .controller('WorkCtrl', WorkCtrl);

function WorkCtrl($scope, $rootScope, $timeout, PubSub, SessionApi, Animator, StateService, localStorageService) {

  var ctrl = this;

  console.log('how this works controller');


  WorkCtrl.$inject['$scope', '$rootScope', '$timeout', 'PubSub', 'SessionApi', 'Animator', 'StateService', 'localStorageService'];
}
