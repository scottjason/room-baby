'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', SessionCtrl);

function SessionCtrl($scope, $state, UserApi, PubSub) {

  var vm = this;

  this.init = function() {
    console.log('session initiated');
  }

  SessionCtrl.$inject['$scope', '$state', 'UserApi', 'PubSub'];
}
