angular.module('RoomBaby')
  .factory('Animation', function() {

    'use strict'

    function run(type) {
      if (type === 'onLanding') {
        onLanding();
      } else if (type === 'onDashboard') {
        onDashboard();
      } else if (type === 'onRegister') {
        onRegister();
      } else if (type === 'onLogin') {
        onLogin();
      }
    }

    function onLanding() {
      var element = angular.element(document.getElementById('room-baby'));
      var opts = {
        duration: 1500
      };
      element.velocity('fadeIn', opts);
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

    function onRegister () {
      var element = angular.element(document.getElementById('register-copy'));
      var opts = {
        duration: 700,
        delay: 200
      };
      element.velocity('transition.slideUpIn', opts);
    }

    function onLogin (argument) {
      var element = angular.element(document.getElementById('login-copy'));
      var opts = {
        duration: 700,
        delay: 200
      };
      element.velocity('transition.slideUpIn', opts);
    }

    return ({
      run: run
    });
  });
