'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $stateParams, $timeout, $window, ngDialog, ConstantService, StateService, PubSub, UserApi, SessionApi, Animator, TimeService, localStorageService) {

  var ctrl = this;
  $scope.room = {};

  var data = {};
  data.message = 'hello';

  $scope.$watch('invalidDateErr', function() {
    if ($scope.invalidDateErr) {
      $timeout(function() {
        $scope.invalidDateErr = false;
      }, 1600);
    }
  });

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {

        if (localStorageService.get('user')) {
          $scope.user = localStorageService.get('user');
        }
        if (localStorageService.get('sessions')) {
          $scope.sessions = localStorageService.get('sessions');
        }
        ctrl.initialize();
      } else {
        localStorageService.clearAll()
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }
    }, function(err) {
      localStorageService.clearAll()
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  this.registerEvents = function() {
    PubSub.on('setUserName', ctrl.setUserName);
    PubSub.on('renderTable', ctrl.renderTable);
    PubSub.on('createRoom:renderMessage', ctrl.renderMessage);
    PubSub.on('createRoom:renderConfirmation', ctrl.renderConfirmation);
  };


  ctrl.initialize = function() {
    if (localStorageService.get('isFacebookLogin')) {
      ctrl.onFacebookLogin($state.params.user_id);
    } else {
      PubSub.trigger('toggleNavBar', true);
      PubSub.trigger('setUser', $scope.user);
      var opts = Animator.generateOpts('onDashboard');
      Animator.run(opts);
      ctrl.renderTable(true);
    }
  };

  ctrl.renderConfirmation = function() {
    $scope.showConfirmation = true;
  };

  /* on dashboard option selected */
  this.onOptSelected = function($event, otSession) {
    if ($event.currentTarget.name === 'connect') {
      ctrl.connect(otSession);
    } else if ($event.currentTarget.id === 'on-create-room-confirm') {
      ctrl.createRoom();
    } else if ($event.currentTarget.id === 'on-update-room-submit') {
      ctrl.updateRoom();
    }
  };

  /* on dashboard table row option selected */
  this.onRowSelected = function(otSession) {
    (otSession.status === 'ready') ? ctrl.connect(otSession): ctrl.showOverlay(otSession.status);
  };

  /* date timepicker config */
  this.configDateTimePicker = function() {
    return {
      startView: 'day'
    };
  };

  /* manipulate datepicker before it renders */
  this.beforeRender = function($view, $dates, $leftDate, $upDate, $rightDate) {
    /* format the upDate */
    if ($view === 'day') {
      $upDate.display = TimeService.formatUpDate($upDate.display);
    }
    TimeService.setStartDate($dates);
  };

  /* on collect date time */
  this.onTimeSet = function(newDate, oldDate) {

    var startsAtMsUtc = newDate ? newDate.getTime() : oldDate.getTime();
    var opts = TimeService.generateOpts(startsAtMsUtc);

    TimeService.isValid(opts, function(isValid, obj) {
      if (isValid) {
        StateService.data['createRoom']['startDate'].isValid = true;
        $scope.room.isTimeSet = true;
        $scope.room.startsAt = startsAtMsUtc;
        $scope.room.startsAtFormatted = obj.localFormatted;
        $scope.room.expiresAt = obj.expiresAtMsUtc;
      } else {
        $scope.invalidDateErr = ConstantService.generateError('invalidDate');
      }
    });
  };

  /* return state of input field for copy (instructions or error) */
  this.isValidInput = function(key) {
    var isValid = StateService.data['createRoom'][key].isValid;
    var isPristine = StateService.data['createRoom'][key].isPristine;
    return (isPristine || isValid);
  };

  /* return state of input field for checkmark (field validated) */
  this.markChecked = function(key) {
    var isValid = StateService.data['createRoom'][key].isValid;
    var isPristine = StateService.data['createRoom'][key].isPristine;
    return (isValid && !isPristine);
  };

  /* return the ready state of session status, ability for user to connect */
  this.getReadyState = function(obj) {
    return (obj.status === 'ready');
  };

  /* recursive method to get statuses of room */
  function getStatus() {
    var table = StateService.data['Session'].table
    TimeService.getStatus(table, function(isSessionReady, table) {
      if (!isSessionReady) {
        $timeout(getStatus, 1000);
      } else {
        StateService.data['Session'].table = table;
        $scope.table = table;
        $timeout(getStatus, 1000);
      }
    });
  }

  /* Controller Methods */

  /* on invite form update option selected */
  ctrl.updateRoom = function() {
    $scope.room.startsAt = false;
    $scope.room.startsAtFormatted = '';
    $scope.room.isTimeSet = false;
    StateService.data['createRoom']['startDate'].isValid = false;
    StateService.data['createRoom']['formData'].isValid = false;
  };

  /* on invite form complete, create the room, save to mongo */
  ctrl.createRoom = function() {
    var opts = Animator.generateOpts('onRenderLoading');
    Animator.run(opts);
    $scope.showLoading = true;
    var payload = angular.copy($scope.room);
    payload.host = angular.copy($scope.user);
    SessionApi.createRoom(payload).then(function(response) {
      var obj = {};
      obj.type = 'onOverlayExit';
      Animator.run(obj);
      $timeout(function() {
        $scope.showLoading = false;
        StateService.data['overlay'].isOpen = false;
      }, 1200);
      ctrl.addRoom(response.data.session);
    }, function(err) {
      console.log(err)
    });
  };

  /* then on success, add the new room to client-side storage and re-render table */
  ctrl.addRoom = function(newRoom) {
    var sessions = localStorageService.get('sessions');
    sessions.push(newRoom);
    localStorageService.set('sessions', sessions);
    $scope.showLoading = false;
    ctrl.renderTable(null);
  };

  /* render table (or re-render after save room) */
  ctrl.renderTable = function(isOnLoad) {
    $scope.showTable = true;
    var sessions = localStorageService.get('sessions');

    if (sessions && sessions.length) {
      TimeService.generateTable(sessions, function(table) {
        StateService.data['Session'].table = table;
        $scope.table = table;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
        if (isOnLoad) {
          getStatus();
        }
      });
    };
  };

  ctrl.renderMessage = function(binding, message) {
    $scope[binding] = message;
    $scope.$apply();
    $timeout(function() {
      $scope[binding] = '';
    }, 1600);
  };

  ctrl.onFacebookLogin = function(user_id) {
    UserApi.getAll(user_id).then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        PubSub.trigger('setUser', user);
        ctrl.onFacebookSuccess(user, null);
      } else if (response.status === 200) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        PubSub.trigger('setUser', user);
        ctrl.onFacebookSuccess(user, sessions);
      } else {
        PubSub.trigger('toggleNavBar', null);
        PubSub.trigger('toggleFooter', null);
        localStorageService.clearAll();
        $state.go('landing');
      }
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.onFacebookSuccess = function(user, sessions) {
    $scope.user = user;

    if (sessions) {
      localStorageService.set('sessions', sessions);
    }
    if (!$scope.user.username) {
      ctrl.getUserName();
    } else {
      PubSub.trigger('toggleNavBar', true);
      var obj = {};
      obj.type = 'onDashboard';
      Animator.run(obj);
      ctrl.renderTable(true);
    }
  };

  ctrl.getUserName = function(callback) {
    ngDialog.openConfirm({
      template: '../../views/ngDialog/facebook.html',
      controller: 'FooterCtrl'
    });
  };

  ctrl.setUserName = function(username) {
    var payload = {};
    payload._id = $scope.user._id;
    payload.username = username;
    ctrl.saveUserName(payload);
  };

  ctrl.saveUserName = function(payload) {
    UserApi.saveUserName(payload).then(function(response) {
      localStorageService.remove('isFacebookLogin')
      var user = response.data.user;
      PubSub.trigger('setUser', user);
      $scope.user = user;
      localStorageService.set('user', user);
      ctrl.onUserNameSuccess();
    });
  };

  ctrl.onUserNameSuccess = function() {
    ngDialog.closeAll();
    $timeout(function() {
      PubSub.trigger('toggleNavBar', true);
      var obj = {};
      obj.type = 'onDashboard';
      Animator.run(obj);
      ctrl.renderTable(true);
    }, 350);
  };

  ctrl.connect = function(otSession) {
    localStorageService.set('otSession', otSession);
    var opts = {
      user_id: $scope.user._id
    };
    $state.go('session', opts);
  };

  DashCtrl.$inject['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$window', 'ngDialog', 'ConstantService', 'StateService', 'PubSub', 'UserApi', 'SessionApi', 'Animator', 'TimeService', 'localStorageService'];
}
