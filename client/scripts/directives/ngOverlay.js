angular.module('RoomBaby')
  .directive('ngOverlay', function(Animator, Validator, StateService) {
    return function(scope, element, attrs) {
      element.bind('click', function(event) {

        var obj = {};

        var isCreateBtn = (event.target.id === 'create-room-btn');
        var isSubmitBtn = (event.target.id === 'on-create-room-submit');
        var isExitBtn = (event.target.id === 'dash-overlay-exit-btn');
        var isOpen = StateService.data['overlay'].isOpen;

        if (!isOpen && isCreateBtn) {
          obj.type = 'onCreateRoom';
          StateService.data['overlay'].isOpen = true;
          Animator.run(obj);
        } else if (isOpen && isExitBtn && !isSubmitBtn) {
          StateService.data['createRoom']['name'].text = '';
          StateService.data['createRoom']['guestEmail'].text = '';
          StateService.data['createRoom']['name'].isValid = false;
          StateService.data['createRoom']['guestEmail'].isValid = false;
          StateService.data['createRoom']['formData'].isValid = false;
          StateService.data['overlay'].isOpen = false;
          scope.$apply(attrs.clearForm);

          if (scope.showCalendar) {
            scope.showCalendar = false;
            if (!scope.$$phase) {
              scope.$apply();
            }
          }
          obj.type = 'onOverlayExit';
          Animator.run(obj);
        }
      });
    }
    ngOverlay.$inject('Animator, Validator, StateService');
  });
