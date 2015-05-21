'use strict';

angular.module('RoomBaby')
  .controller('FooterCtrl', FooterCtrl);

function FooterCtrl($scope, PubSub) {
  var vm = this;
  $scope.user = {};

  this.registerEvents = function() {
    PubSub.on('toggleFooter', function(_bool) {
      $scope.showFooter = _bool;
    });

    PubSub.on('setUser', function(user) {
      $scope.user = user;
    });
  };

  this.submitUserName = function(data) {
    PubSub.trigger('setUserName', $scope.user.username);
  };

  this.options = function(type) {
    if (type === 'disconnect') {
      PubSub.trigger('disconnect');
    }
  };
  FooterCtrl.$inject['$scope', 'PubSub'];
}
