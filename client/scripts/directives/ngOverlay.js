angular.module('RoomBaby')
  .directive('ngOverlay', function(pubSub) {
    return function(scope, element, attrs) {
      element.bind('click', function(event) {

      });
    };
  ngOverlay.$inject('pubSub');
});