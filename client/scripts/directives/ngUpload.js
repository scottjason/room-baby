angular.module('RoomBaby')
  .directive('ngUpload', function($parse) {
    return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.ngUpload);
      var modelSetter = model.assign;
      element.bind('change', function() {
        scope.$apply(function() {
          modelSetter(scope, element[0].files[0]);
        })
      })
    }
  };
  ngUpload.$inject('$parse');
});
