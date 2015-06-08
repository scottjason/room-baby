angular.module('RoomBaby')
  .factory('animator', function() {

    'use strict'

    function run(obj) {
      if (obj.type === 'onLanding') {
        onLanding(obj.hasAnimated);
      } else if (obj.type === 'onDashboard') {
        onDashboard();
      } else if (obj.type === 'onRegister') {
        onRegister();
      } else if (obj.type === 'onLogin') {
        onLogin();
      }
    }

    function onLanding(hasAnimated) {
      var element = angular.element(document.getElementById('room-baby'));
      var opts;
      if (!hasAnimated) opts = { duration: 1200 };
      if (!opts) opts = { duration: 0 };

      element.velocity('fadeIn', opts);
    }

    function onDashboard() {
      var whiteBlock = angular.element(document.getElementById('white-block'));
      var createRoomBtn = angular.element(document.getElementById('create-room-btn'));
      var createBroadcastBtn = angular.element(document.getElementById('create-broadcast-btn'));
      var dashSequence = [{
        e: whiteBlock,
        p: {
          translateZ: 0,
          translateY: '140px'
        },
        o: {
          duration: 700,
          display: 'block'
        }
      }, {
        e: createRoomBtn,
        p: {
          opacity: 1
        },
        o: {
          duration: 300
        }
      }, {
        e: createBroadcastBtn,
        p: {
          opacity: 1
        },
        o: {
          duration: 300
        }
      }];
      $.Velocity.RunSequence(dashSequence);
    }

    function onRegister() {
      var element = angular.element(document.getElementById('register-copy'));
      var opts = {
        duration: 700,
        delay: 50
      };
      element.velocity('transition.slideUpIn', opts);
    }

    function onLogin() {
      var sequence;
      var needAcct = angular.element(document.getElementById('need-account'));
      var forgotPassword = angular.element(document.getElementById('forgot-password'));
      var rememberMe = angular.element(document.getElementById('remember-me'));
      sequence = [{
        e: needAcct,
        p: 'transition.slideUpIn',
        o: {
          duration: 700,
          display: 'inline-block'
        }
      }, {
        e: forgotPassword,
        p: 'transition.slideUpIn',
        o: {
          duration: 700,
          display: 'inline-block',
          sequenceQueue: false
        }
      }, {
        e: rememberMe,
        p: 'transition.slideUpIn',
        o: {
          duration: 700,
          display: 'inline-block',
          sequenceQueue: false
        }
      }];
      $.Velocity.RunSequence(sequence);
    }

    return ({
      run: run
    });
  });
