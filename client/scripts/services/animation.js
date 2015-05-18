angular.module('RoomBaby')
  .factory('Animation', function() {

    'use strict'


    function run(type) {
      if (type === 'onLanding') {
        onLanding();
      } else if (type === 'onDashboard') {
        onDashboard();
      }
    };

    function onLanding() {
      var roomBaby = angular.element(document.getElementById('room-baby'));
      var opts = {
        duration: 1500
      };
      roomBaby.velocity('fadeIn', opts);
    }

    function onDashboard() {
      var whiteBlock = angular.element(document.getElementById('white-block'));
      var createRoomBtn = angular.element(document.getElementById('create-room-btn'));
      var createBroadcastBtn = angular.element(document.getElementById('create-broadcast-btn'));
      var dashSequence = [
    { e: whiteBlock, p: { translateZ: 0, translateY: '140px' }, o: { duration: 700, display: 'block' } },
    { e: createRoomBtn, p: { opacity: 1 }, o: { duration: 300 } },
    { e: createBroadcastBtn, p: { opacity: 1 }, o: { duration: 300 } }];
    $.Velocity.RunSequence(dashSequence);
    }
    return ({
      run: run
    });
  });
