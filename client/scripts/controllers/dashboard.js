'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $timeout, $window, socket, ngDialog, stateService, pubSub, userApi, sessionApi, animator, timeService, localStorageService) {

  var ctrl = this;

  $scope.room = {};

  $scope.$watch('invalidDateErr', function() {
    if ($scope.invalidDateErr) {
      $timeout(function() {
        $scope.invalidDateErr = false;
      }, 1600);
    }
  });

  /* Dom Bindings */
  this.initialize = function() {
    if (localStorageService.get('isFacebookLogin')) {
      var user_id = $state.params.user_id
      ctrl.onFacebookLogin(user_id);
    } else if (!localStorageService.get('user')) {
      localStorageService.clearAll();
      $state.go('landing');
    } else {
      var obj = {};
      obj.type = 'onDashboard';
      $scope.user = localStorageService.get('user');
      pubSub.trigger('setUser', $scope.user);
      pubSub.trigger('toggleNavBar', true);
      animator.run(obj);
      ctrl.renderTable(true);
    }
  };

  this.registerEvents = function() {
    pubSub.on('setUserName', ctrl.setUserName);
    pubSub.on('createRoom:renderMessage', ctrl.renderMessage);
    pubSub.on('createRoom:renderConfirmation', ctrl.renderConfirmation);
  };

  ctrl.renderConfirmation = function() {
    $scope.showConfirmation = true;
  }

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
    if (otSession.status === 'ready') {
      ctrl.connect(otSession);
    } else {
      ctrl.showOverlay(otSession.status);
    }
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
      $upDate.display = timeService.formatUpDate($upDate.display);
    }
    timeService.setStartDate($dates);
  };

  /* on collect date time */
  this.onTimeSet = function(newDate, oldDate) {

    var obj = {};

    var dateSelected = newDate || oldDate
    var startsAtMsUtc = dateSelected.getTime();

    obj.isStartTime = true;
    obj.startsAt = startsAtMsUtc;

    timeService.validate(obj, function(isValid, obj) {
      if (isValid) {
        stateService.data['createRoom']['startDate'].isValid = true;
        $scope.room.isTimeSet = true;
        $scope.room.startsAt = startsAtMsUtc;
        $scope.room.startsAtFormatted = obj.localFormatted;
        $scope.room.expiresAt = obj.expiresAtMsUtc;
      } else {
        $scope.invalidDateErr = 'you cannot schedule a room for a date in the past';
      }
    });
  };

  /* return state of input field for copy (instructions or error) */
  this.isValidInput = function(key) {
    var isValid = stateService.data['createRoom'][key].isValid;
    var isPristine = stateService.data['createRoom'][key].isPristine;
    if (isPristine || isValid) return true;
    return false;
  };

  /* return state of input field for checkmark (field validated) */
  this.markChecked = function(key) {
    var isValid = stateService.data['createRoom'][key].isValid;
    var isPristine = stateService.data['createRoom'][key].isPristine;
    if (isValid && !isPristine) return true;
    return false;
  };

  /* return the ready state of session status, ability for user to connect */
  this.getReadyState = function(obj) {
    return (obj.status === 'ready');
  };

  /* recursive method to get statuses of room */
  function getStatus() {
    var table = stateService.data['Session'].table
    timeService.getStatus(table, function(isSessionReady, table) {
      if (!isSessionReady) {
        $timeout(getStatus, 1000);
      } else {
        stateService.data['Session'].table = table;
        $scope.table = table;
        $timeout(getStatus, 1000);
      }
    });
  }

  /* Controller Methods */

  /* on invite form update option selected */
  ctrl.updateRoom = function() {
    $scope.room.startsAt = null;
    $scope.room.startsAtFormatted = null;
    $scope.room.isTimeSet = false;
    stateService.data['createRoom']['startDate'].isValid = false;
    stateService.data['createRoom']['form'].isValid = false;
  };

  /* on invite form complete, create the room, save to mongo */
  ctrl.createRoom = function() {
    var payload = angular.copy($scope.room);
    payload.host = angular.copy($scope.user);
    sessionApi.createRoom(payload).then(function(response) {
      stateService.data['overlay'].isOpen = false;
      var obj = {};
      obj.type = 'onOverlayExit';
      animator.run(obj);
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
      timeService.generateTable(sessions, function(table) {
        stateService.data['Session'].table = table;
        $scope.table = table;
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
    userApi.getAll(user_id).then(function(response) {
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        pubSub.trigger('setUser', user);
        ctrl.onFacebookSuccess(user, null);
      } else if (response.status === 200) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        pubSub.trigger('setUser', user);
        pubSub.trigger('toggleNavBar', true);
        pubSub.trigger('toggleFooter', true);
        ctrl.onFacebookSuccess(user, sessions);
      } else {
        pubSub.trigger('toggleNavBar', null);
        pubSub.trigger('toggleFooter', null);
        localStorageService.clearAll();
        $state.go('landing');
      }
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.onFacebookSuccess = function(user, sessions) {
    $scope.user = user
    if (sessions) {
      localStorageService.set('sessions', sessions);
    }
    if (!$scope.user.username) {
      pubSub.trigger('toggleNavBar', null);
      pubSub.trigger('toggleFooter', null);
      ctrl.getUserName();
    } else {
      pubSub.trigger('toggleNavBar', true);
      pubSub.trigger('toggleFooter', true);
      animator.run('onDashboard');
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
    userApi.saveUserName(payload).then(function(response) {
      localStorageService.remove('isFacebookLogin')
      var user = response.data.user;
      pubSub.trigger('setUser', user);
      $scope.user = user;
      localStorageService.set('user', user);
      ctrl.onUserNameSuccess();
    });
  };

  ctrl.onUserNameSuccess = function() {
    ngDialog.closeAll();
    pubSub.trigger('toggleNavBar', true);
    pubSub.trigger('toggleFooter', true);
    $timeout(function() {
      animator.run('onDashboard');
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

  DashCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'socket', 'ngDialog', 'stateService', 'pubSub', 'userApi', 'sessionApi', 'animator', 'timeService', 'localStorageService'];
}
