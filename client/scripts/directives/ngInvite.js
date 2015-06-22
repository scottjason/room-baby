angular.module('RoomBaby')
  .directive('ngInvite', function(validator, pubSub, stateService) {

    'use strict';

    return {
      restrict: 'A',
      scope: {
        name: '=',
        guestEmail: '=',
        onTimeSet: '=',
      },
      link: function(scope, element, attrs) {
        element.bind('click', function($event){
          var isSubmitBtn = ($event.target.id === 'on-create-room-submit');
          var isValid = stateService.data['createRoom']['form'].isValid;
          if (isSubmitBtn && isValid) {
            pubSub.trigger('createRoom:renderConfirmation');
          } else if (isSubmitBtn && !isValid)  {
            pubSub.trigger('createRoom:renderMessage', 'createRoomErr', 'please complete all fields');
          }
        });
      },
      controller: ['$scope', function($scope) {

        $scope.$watch('onTimeSet', function() {
          console.log("watching on timeset")
          if ($scope.onTimeSet) {
            console.log('timeset valid');
            stateService.data['createRoom']['startDate'].isValid = true;
            var isValidName = stateService.data['createRoom']['name'].isValid;
            var isValidEmail = stateService.data['createRoom']['guestEmail'].isValid;
            if (isValidName && isValidEmail) {
              stateService.data['createRoom']['form'].isValid = true;
            }
          } else {
            console.log('timeset invalid');
            stateService.data['createRoom']['form'].isValid = false;
          }
        });

        $scope.$watch('name', function() {
          console.log("scope.name", $scope.name);
          var isPristine = !$scope.name;
          if (isPristine) {
            stateService.data['createRoom']['name'].isPristine = true;
            stateService.data['createRoom']['form'].isValid = false;
          } else {
            stateService.data['createRoom']['name'].isPristine = false;
          }

          var isValid = ($scope.name && $scope.name.length >= 3);
          if (isValid) {
            stateService.data['createRoom']['name'].text = $scope.name;
            stateService.data['createRoom']['name'].isValid = true;
            var isValidDate = stateService.data['createRoom']['startDate'].isValid
            var isValidEmail = stateService.data['createRoom']['guestEmail'].isValid;
            if (isValidDate && isValidEmail) {
              stateService.data['createRoom']['form'].isValid = true;
            }
          } else {
            console.log('name invalid');
            stateService.data['createRoom']['name'].isValid = false;
            stateService.data['createRoom']['form'].isValid = false;
          }
        });

        $scope.$watch('guestEmail', function() {
          var isPristine = !$scope.guestEmail;
          if (isPristine) {
            stateService.data['createRoom']['guestEmail'].isPristine = true;
            stateService.data['createRoom']['form'].isValid = false;
          } else {
            stateService.data['createRoom']['guestEmail'].isPristine = false;
          }

          var obj = {};
          obj.type = 'createRoom:email';
          obj.guestEmail = $scope.guestEmail;

          validator.validate(obj, function(isValid) {
            if (isValid) {
            console.log('email valid');
              var isValidDate = stateService.data['createRoom']['startDate'].isValid
              var isValidName = stateService.data['createRoom']['name'].isValid;
              stateService.data['createRoom']['guestEmail'].text = $scope.name;
              stateService.data['createRoom']['guestEmail'].isValid = true;
              if (isValidDate && isValidName) {
                stateService.data['createRoom']['form'].isValid = true;
              }
            } else {
            console.log('email invalid');
              stateService.data['createRoom']['guestEmail'].isValid = false;
              stateService.data['createRoom']['form'].isValid = false;
            }
          });
        });
      }],
    }
    ngInvite.$inject('validator, pubSub, stateService')
  });
