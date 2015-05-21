angular.module('RoomBaby')
  .directive('appClick', function() {
    return {
      restrict: 'E',
      link: function(scope, elem, attr) {
        elem.bind('click', function() {
        })
      }
    };
  });
