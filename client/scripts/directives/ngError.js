angular.module('RoomBaby')
  .directive('ngError', function($parse, pubSub, validator, stateService) {

    'use strict';

    return {
      restrict: 'A',
      scope: {
        name: '=',
        guestEmail: '='
      },
      link: function(scope, element, attrs) {

        element.bind('keyup keydown click', function(event) {

          var isNamePristine = stateService.data['createRoom']['name'].isPristine;
          var isEmailPristine = stateService.data['createRoom']['guestEmail'].isPristine;

          var createRoomTitle = 'please enter a name for the room';
          var createRoomTitleErr = 'please enter a room name of three or more characters';

          var createRoomEmail = 'the email address of your guest';
          var createRoomEmailErr = 'please enter a valid email address'

          var isValidName = stateService.data['createRoom']['name'].isValid;
          var isValidEmail = stateService.data['createRoom']['guestEmail'].isValid;

          if (!isValidName && !isNamePristine) {
            pubSub.trigger('dashCtrl:inValidName', 'createRoomTitle', createRoomTitleErr);
          } else if (isValidName || isNamePristine) {
            pubSub.trigger('dashCtrl:validName', 'createRoomTitle', createRoomTitle);
          }
          if (!isValidEmail && !isEmailPristine) {
            pubSub.trigger('dashCtrl:inValidEmail', 'createRoomEmail', createRoomEmailErr);
          } else if (isValidEmail || isEmailPristine) {
            pubSub.trigger('dashCtrl:validEmail', 'createRoomEmail', createRoomEmail);
          }
        });
      },
      controller: ['$scope', function($scope) {

        $scope.$watch('name', function() {

          var isPristine = !$scope.name;

          if (isPristine) {
            stateService.data['createRoom']['name'].isPristine = true;
          } else {
            stateService.data['createRoom']['name'].isPristine = false;
          }

          var isValid = ($scope.name && $scope.name.length >= 3);

          if (isValid) {
            stateService.data['createRoom']['name'].text = $scope.name;
            stateService.data['createRoom']['name'].isValid = true;
          } else {
            stateService.data['createRoom']['name'].isValid = false;
          }
        });

        $scope.$watch('guestEmail', function() {

          var isPristine = !$scope.guestEmail;

          if (isPristine) {
            stateService.data['createRoom']['guestEmail'].isPristine = true;
          } else {
            stateService.data['createRoom']['guestEmail'].isPristine = false;
          }

          var obj = {};
          obj.type = 'createRoom:email';
          obj.guestEmail = $scope.guestEmail;

          validator.validate(obj, function(isValid) {
            if (isValid) {
              console.log('setting guest email to valid');
              stateService.data['createRoom']['guestEmail'].text = $scope.name;
              stateService.data['createRoom']['guestEmail'].isValid = true;
            } else {
              stateService.data['createRoom']['guestEmail'].isValid = false;
            }
          });
        });
      }],
    }
    ngError.$inject('$parse, pubSub, validator, stateService')
  });
