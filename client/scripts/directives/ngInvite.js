angular.module('RoomBaby')
  .directive('ngInvite', function(Validator, PubSub, StateService) {

    'use strict';

    return {
      restrict: 'A',
      scope: {
        name: '=',
        guestEmail: '=',
        onTimeSet: '=',
      },
      link: function(scope, element, attrs) {
        element.bind('click', function($event) {
          var isCreateRoomNowBtn = ($event.target.id === 'on-create-room-now');
          var isCreateRoomLaterBtn = ($event.target.id === 'on-create-room-later');
          if (isCreateRoomNowBtn || isCreateRoomLaterBtn) {
            isCreateRoomNowBtn ? PubSub.trigger('createRoomOpt', true) : PubSub.trigger('createRoomOpt', null);
          }
          var isSubmitBtn = ($event.target.id === 'on-create-room-submit');
          var isValid = StateService.data['createRoom']['formData'].isValid;
          if (isSubmitBtn && isValid) {
            PubSub.trigger('createRoom:renderConfirmation');
          } else if (isSubmitBtn && !isValid) {
            PubSub.trigger('createRoom:renderMessage', 'createRoomErr', 'please complete all fields');
          }
        });
      },
      controller: ['$scope', function($scope) {

        $scope.$watch('onTimeSet', function() {
          if ($scope.onTimeSet) {
            StateService.data['createRoom']['startDate'].isValid = true;
            var isValidName = StateService.data['createRoom']['name'].isValid;
            var isValidEmail = StateService.data['createRoom']['guestEmail'].isValid;
            if (isValidName && isValidEmail) {
              StateService.data['createRoom']['formData'].isValid = true;
            }
          } else {
            StateService.data['createRoom']['formData'].isValid = false;
          }
        });

        $scope.$watch('name', function() {
          var isPristine = !$scope.name;
          if (isPristine) {
            StateService.data['createRoom']['name'].isPristine = true;
            StateService.data['createRoom']['formData'].isValid = false;
          } else {
            StateService.data['createRoom']['name'].isPristine = false;
          }

          var isValid = ($scope.name && $scope.name.length >= 3);
          if (isValid) {
            StateService.data['createRoom']['name'].text = $scope.name;
            StateService.data['createRoom']['name'].isValid = true;
            var isValidDate = StateService.data['createRoom']['startDate'].isValid
            var isValidEmail = StateService.data['createRoom']['guestEmail'].isValid;
            if (isValidDate && isValidEmail) {
              StateService.data['createRoom']['formData'].isValid = true;
            }
          } else {
            StateService.data['createRoom']['name'].isValid = false;
            StateService.data['createRoom']['formData'].isValid = false;
          }
        });

        $scope.$watch('guestEmail', function() {
          var isPristine = !$scope.guestEmail;
          if (isPristine) {
            StateService.data['createRoom']['guestEmail'].isPristine = true;
            StateService.data['createRoom']['formData'].isValid = false;
          } else {
            StateService.data['createRoom']['guestEmail'].isPristine = false;
          }

          var opts = {};
          opts.type = 'email';
          opts.email = $scope.guestEmail;

          Validator.validate(opts, function(isValid) {
            if (isValid) {
              var isValidDate = StateService.data['createRoom']['startDate'].isValid
              var isValidName = StateService.data['createRoom']['name'].isValid;
              StateService.data['createRoom']['guestEmail'].text = $scope.name;
              StateService.data['createRoom']['guestEmail'].isValid = true;
              if (isValidDate && isValidName) {
                StateService.data['createRoom']['formData'].isValid = true;
              }
            } else {
              StateService.data['createRoom']['guestEmail'].isValid = false;
              StateService.data['createRoom']['formData'].isValid = false;
            }
          });
        });
      }],
    }
    ngInvite.$inject('Validator, PubSub, StateService')
  });
