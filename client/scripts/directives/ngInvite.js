angular.module('RoomBaby')
  .directive('ngInvite', function(pubSub, validator, stateService) {

    'use strict';

    return {
      restrict: 'A',
      scope: {
        name: '=',
        guestEmail: '=',
        onTimeSet: '='
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

        $scope.$watch('onTimeSet', function() {
          if ($scope.onTimeSet) {
            stateService.data['createRoom']['startDate'].isSet = true;
            var isValidName = stateService.data['createRoom']['name'].isValid;
            var isValidEmail = stateService.data['createRoom']['guestEmail'].isValid;
            if (isValidName && isValidEmail) {
              pubSub.trigger('dashCtrl:onInviteReady');
            }
          } else {
            stateService.data['createRoom']['startDate'].isSet = false;
          }
        });

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
            var isTimeSet = stateService.data['createRoom']['startDate'].isSet
            var isValidEmail = stateService.data['createRoom']['guestEmail'].isValid;
            if (isTimeSet && isValidEmail) {
              pubSub.trigger('dashCtrl:onInviteReady');
            }
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
              var isTimeSet = stateService.data['createRoom']['startDate'].isSet
              var isValidName = stateService.data['createRoom']['name'].isValid;
              stateService.data['createRoom']['guestEmail'].text = $scope.name;
              stateService.data['createRoom']['guestEmail'].isValid = true;
              if (isTimeSet && isValidName) {
                pubSub.trigger('dashCtrl:onInviteReady');
              }
            } else {
              stateService.data['createRoom']['guestEmail'].isValid = false;
            }
          });
        });
      }],
    }
    ngInvite.$inject('pubSub, validator, stateService')
  });
