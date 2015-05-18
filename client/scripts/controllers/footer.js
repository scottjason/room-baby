'use strict';

angular.module('RoomBaby')
  .controller('Footer', Footer);

function Footer($scope, PubSub) {
  var vm = this;

  PubSub.on('toggleFooter', function(_bool) {
    $scope.showFooter = _bool;
  });

  PubSub.on('setUser', function(user) {
    $scope.user = user;
  });

  Footer.$inject['$scope', 'PubSub'];
}
