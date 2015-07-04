angular.module('RoomBaby')
  .factory('Animator', function() {

    'use strict'

    function run(obj) {
      var type = obj.type;
      if (type === 'onLanding') {
        onLanding(obj.hasAnimated);
      } else if (type === 'onDashboard') {
        onDashboard();
      } else if (type === 'onRegister') {
        onRegister();
      } else if (type === 'onLogin') {
        onLogin();
      } else if (type === 'onFooter') {
        onFooter();
      } else if (type === 'onCreateRoom') {
        onCreateRoom();
      }else if (type === 'onOverlayExit') {
        onOverlayExit();
      } else if (type === 'onFooterOverlay') {
        onFooterOverlay(obj.callback);
      } else if (type === 'onRenderLoading'){
        onRenderLoading(obj.props);
      }
    }

    function onLanding(hasAnimated) {
      var roomBaby = angular.element(document.getElementById('room-baby'));
      var opts;
      if (!hasAnimated) opts = { duration: 1200, delay: 250 };
      if (!opts) return document.getElementById('room-baby').style.opacity = 1;

      roomBaby.velocity('transition.slideDownIn', opts);
    }

    function onDashboard() {
      var optsContainer = angular.element(document.getElementById('opts-container'));
      var createRoomBtn = angular.element(document.getElementById('create-room-btn'));
      var createBroadcastBtn = angular.element(document.getElementById('create-broadcast-btn'));
      var sequence = [
        { e: optsContainer, p: { translateZ: 0, translateY: '140px' }, o: { duration: 700, display: 'block' } }, 
        { e: createRoomBtn, p: { opacity: 1 }, o: { duration: 300 } },
        { e: createBroadcastBtn, p: { opacity: 1 }, o: { duration: 300 } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onRegister() {
      var registerCopy = angular.element(document.getElementById('register-copy'));
      var opts = { duration: 700, delay: 50 };
      registerCopy.velocity('transition.slideUpIn', opts);
    }

    function onLogin() {
      var needAcct = angular.element(document.getElementById('need-account'));
      var forgotPassword = angular.element(document.getElementById('forgot-password'));
      var rememberMe = angular.element(document.getElementById('remember-me'));
      var sequence = [
        { e: needAcct, p: 'transition.slideUpIn', o: { duration: 700, display: 'inline-block' } }, 
        { e: forgotPassword, p: 'transition.slideUpIn', o: { duration: 700, display: 'inline-block', sequenceQueue: false } }, 
        { e: rememberMe, p: 'transition.slideUpIn', o: { duration: 700, display: 'inline-block', sequenceQueue: false } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onFooter() {
      var footerBtns = angular.element(document.getElementById('footer-btns'));
      var opts = { visibility: 'visible', display: 'inline-flex', duration: 750, delay: 500 };
      footerBtns.velocity("transition.slideUpIn", opts);
    }

    function onCreateRoom() {
      var dashboardContainer = angular.element(document.getElementById('dashboard-container'));
      var dashboardTable = angular.element(document.getElementById('dashboard-table'));
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
      var sequence = [
        { e: dashboardContainer, p: 'fadeOut', o: { duration: 200, opacity: 0 } }, 
        { e: dashboardTable, p: 'fadeOut', o: { duration: 200,  opacity: 0, sequenceQueue: false } },
        { e: dashboardOverlay, p: 'fadeIn', o: { duration: 350, delay: 100,  opacity: 1, sequenceQueue: true } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onOverlayExit() {
      var dashboardContainer = angular.element(document.getElementById('dashboard-container'));
      var dashboardTable = angular.element(document.getElementById('dashboard-table'));
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
      var sequence = [
        { e: dashboardOverlay, p: 'fadeOut', o: { duration: 0, opacity: 0 } }, 
        { e: dashboardContainer, p: 'fadeIn', o: { duration: 350,  opacity: 1, delay: 100, sequenceQueue: true } },
        { e: dashboardTable, p: 'fadeIn', o: { duration: 100, opacity: 1, sequenceQueue: false } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onFooterOverlay(cb) {
      var footerOverlay = angular.element(document.getElementById('footer-overlay'));
      var footerBtnContainer = angular.element(document.getElementById('footer-btn-container'));
      var sequence = [
        { e: footerOverlay, p: 'transition.slideUpIn', o: { duration: 800, delay: 200, display: 'block' } },
        { e: footerBtnContainer, p: 'transition.slideUpIn', o: { duration: 800, delay: 10,  display: 'block' } } 
      ];
      $.Velocity.RunSequence(sequence);
      cb();
    }

    function onRenderLoading(props) {
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
      dashboardOverlay.velocity(props);
    }

    return ({
      run: run
    });
  });
