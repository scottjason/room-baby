angular.module('RoomBaby')
  .directive('appClick', function() {
    return {
      restrict: 'A',
      controller: 'NavBar',
      controllerAs: 'navCtrl',
      link: function($scope, elem, attr) {
        
      }
    };
  });
