angular.module('RoomBaby')
  .directive('upload', function($parse) {
    return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.upload);
      var modelSetter = model.assign;
      element.bind('change', function() {
        scope.$apply(function() {
          modelSetter(scope, element[0].files[0]);
        })
      })
    }
  };
  upload.$inject('$parse');
});
