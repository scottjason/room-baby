angular.module('RoomBaby')
  .directive('ngOverlay', function(animator) {
    return function(scope, element, attrs) {
      element.bind('click', function(event) {

        var obj = {};

        var isCreateRoomBtn = (event.target.id === 'create-room-btn');
        var isDashOverlayExitBtn = (event.target.id === 'dash-overlay-exit-btn');

        if (isCreateRoomBtn) {
          obj.type = 'onCreateRoom';
          animator.run(obj);
        } else if (isDashOverlayExitBtn) {
          obj.type = 'onOverlayExit';
          animator.run(obj);
      }
    });
  };
ngOverlay.$inject('animator');
});