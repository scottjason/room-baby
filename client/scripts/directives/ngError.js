angular.module('RoomBaby')
  .directive('ngError', function(validator, stateService, pubSub) {

    'use strict';

    return {
      restrict: 'A',
      scope: {
        roomName: '=',
        roomGuestEmail: '=',
        roomStartDate: '='
      },
      link: function(scope, element, attrs) {
        element.bind('keyup keydown click', function(event) {

          var isValidName = stateService.data['createRoom']['name'].isValid;
          var isValidEmail = stateService.data['createRoom']['guestEmail'].isValid;
          var isValidDate = stateService.data['createRoom']['startDate'].isValid;

          if (!isValidName) pubSub.trigger('dashCtrl:inValidName');
          if (!isValidEmail) pubSub.trigger('dashCtrl:inValidEmail');
          if (!isValidDate) pubSub.trigger('dashCtrl:inValidDate');

          if (isValidEmail || isValidEmail ||isValidDate) pubSub.trigger('dashCtrl:activateBtn');

        });
      },
      controller: ['$scope', function($scope) {
        $scope.$watch('roomName', function() {
          var isValid = ($scope.roomName.length >= 3);
          if (isValid) {
            stateService.data['createRoom']['name'].text = $scope.roomName;
            stateService.data['createRoom']['name'].isValid = true;
          } else {
            stateService.data['createRoom']['name'].isValid = false;
          }
        });
        $scope.$watch('roomGuestEmail', function(){
          var obj = {};
          obj.type = 'createRoom:email';
          obj.guestEmail = $scope.roomGuestEmail;
          validator.validate(obj, function(isValid){
            if (isValid) {
              stateService.data['createRoom']['guestEmail'].text = $scope.roomName;
              stateService.data['createRoom']['guestEmail'].isValid = true;
            }
            stateService.data['createRoom']['guestEmail'].isValid = false;
          });
        });
      }],
    }
    ngError.$inject('validator, stateService, pubSub')
  });
