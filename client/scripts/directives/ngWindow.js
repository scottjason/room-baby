angular.module('RoomBaby')
  .directive('ngWindow', function($rootScope, $window) {
    return {
      restrict: 'A',

      link: function(scope, element, attrs) {
        scope.onResize = function() {
          var isDisabled = ($window.innerWidth <= 900);
          if (isDisabled) {
            console.log('isDisabled');
            $rootScope.$broadcast('isDisabled');
          } else {
            console.log('isEnabled');
            $rootScope.$broadcast('isEnabled');
          }
        }
        scope.onResize();
        angular.element($window).bind('resize', function() {
          scope.onResize();
        })
      }
    };
    ngWindow.$inject('$rootScope', '$window');
  });
