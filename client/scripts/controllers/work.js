'use strict';

angular.module('RoomBaby')
  .controller('WorkCtrl', WorkCtrl);

function WorkCtrl($scope, $state, $timeout, PubSub, Animator) {

  PubSub.trigger('toggleOverflow', true);

  var obj = {};
  obj.type = 'onHowThisWorks';

  Animator.run(obj, function() {
    $timeout(function() {
      $scope.toggleColors = true;
    }, 1200);
  });

  this.onExit = function() {
  	 PubSub.trigger('toggleOverflow', false);
  	$state.go('landing', { reload: true });
  };

  WorkCtrl.$inject['$scope', '$state', '$timeout', 'PubSub', 'Animator'];
}
