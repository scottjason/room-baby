angular.module('RoomBaby')
  .directive('ngOverlay', function(animator, validator, stateService) {
    return function(scope, element, attrs) {
      element.bind('click', function(event) {

        var obj = {};

        var isCreateBtn = (event.target.id === 'create-room-btn');
        var isSubmitBtn = (event.target.id === 'on-create-room-submit');
        var isExitBtn = (event.target.id === 'dash-overlay-exit-btn');
        var isOpen = stateService.data['overlay'].isOpen;

        if (!isOpen && isCreateBtn) {
          obj.type = 'onCreateRoom';
          stateService.data['overlay'].isOpen = true;
          animator.run(obj);
        } else if (isOpen && isExitBtn && !isSubmitBtn) {
          stateService.data['overlay'].isOpen = false;
          obj.type = 'onOverlayExit';
          animator.run(obj);
        }
      });
    };
    ngOverlay.$inject('animator, validator, stateService');
  });
