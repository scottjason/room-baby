'use strict';

angular.module('RoomBaby')
  .controller('NavBar', NavBar);

function NavBar($scope, $state, UserApi, PubSub) {
  $scope.showNavBar = null;
  $scope.user = {};
  var vm = this;

  PubSub.on('toggleNavBar', function(_bool) {
    $scope.showNavBar = _bool;
  });

  PubSub.on('setUser', function(user){
    $scope.user = user;
  });

  this.faq = function() {
    console.log('faq');
  };

  this.dropdown = function(opt) {
    if (opt === 'logout') {
      vm.logout($scope.user._id);
    }
  };


  this.createRoom = function() {
    PubSub.trigger('Dashboard:CreateRoom');
  };

  vm.logout = function(user_id) {
    UserApi.logout(user_id).then(function(response){
      $state.go('landing');
    })
  };

  NavBar.$inject['$scope', '$state', 'UserApi', 'PubSub'];
}
