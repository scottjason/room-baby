'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $timeout, $window, socket, ngDialog, stateService, pubSub, userApi, sessionApi, animator, dataService, localStorageService) {

  var ctrl = this;
  $scope.room = {};

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
      ctrl.renderTable();
    }
  };

  this.registerEvents = function() {
    pubSub.on('setUserName', ctrl.setUserName);
    pubSub.on('dashCtrl:inValidName', ctrl.renderMessage);
    pubSub.on('dashCtrl:validName', ctrl.renderMessage);
    pubSub.on('dashCtrl:validEmail', ctrl.renderMessage);
    pubSub.on('dashCtrl:inValidEmail', ctrl.renderMessage);
  };

  /* on dashboard option selected */
  this.onOptSelected = function($event, otSession) {
    if ($event.currentTarget.name === 'connect') {
      ctrl.connect(otSession);
    } else if ($event.currentTarget.id === 'on-create-room-submit') {
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

  /* set current date to active onload */
  this.beforeRender = function($view, $dates, $leftDate, $upDate, $rightDate) {

    var formattedUpDate = moment().format('MMMM YYYY');

    $upDate.display = formattedUpDate;

    angular.forEach($dates, function(date) {

      var incomingUtcValue = date.utcDateValue;
      var currentUtcValue = new Date().getTime();

      var incomingDate = moment(incomingUtcValue).format('YYYY/MM/DD');
      var currentDate = moment(currentUtcValue).format('YYYY/MM/DD');

      var incomingDay = parseInt(moment(angular.copy(incomingDate)).format('D'));
      var incomingMonth = parseInt(moment(angular.copy(incomingDate)).format('M'));
      var incomingYear = parseInt(moment(angular.copy(incomingDate)).format('YYYY'));

      var currentDay = parseInt(moment(angular.copy(currentDate)).format('D'));
      var currentMonth = parseInt(moment(angular.copy(currentDate)).format('M'));
      var currentYear = parseInt(moment(angular.copy(currentDate)).format('YYYY'));

      var isToday = ((currentDay === incomingDay) && (currentMonth === incomingMonth) && (currentYear === incomingYear));
      if (isToday) {
        date.active = true;
      }
    });
  };

  /* on collect date time */
  this.onTimeSet = function(newDate, oldDate) {
    var startsAt;
    if (newDate) {
      var deepCopy = angular.copy(newDate);
      stateService.data['createRoom']['startDate'].jsDateObj = newDate;
      startsAt = moment(newDate).format('MMMM Do YYYY, h:mm:ss a');
      $scope.createRoomDate = startsAt;
      $scope.room.isTimeSet = true;
    } else if (oldDate) {
      var deepCopy = angular.copy(newDate);
      stateService.data['createRoom']['startDate'].jsDateObj = oldDate;
      startsAt = moment(oldDate).format('MMMM Do YYYY, h:mm:ss a');
      $scope.createRoomDate = startsAt;
      $scope.room.isTimeSet = true;

    } else {
      stateService.data['createRoom']['startDate'].isValid = false;
      $scope.room.startsAt = false;
      $scope.room.isTimeSet = false;
    }
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

  /* return state of session status, ability for user to connect */
  this.getState = function(obj) {
    var isReady = (obj.status === 'ready');
    return isReady;
  };

  /* recursive method to get statuses of room */
  function getStatus() {
    var table = stateService.data['Session'].table
    dataService.getStatus(table, function(isSessionReady, table) {
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
    $scope.createRoomDate = false;
    $scope.room.isTimeSet = false;
    stateService.data['createRoom']['startDate'].jsDateObj = '';
    stateService.data['createRoom']['startDate'].utc = '';
    stateService.data['createRoom']['startDate'].isValid = false;
    stateService.data['createRoom']['form'].isValid = false;
    console.log($scope)
  };

  /* on invite form complete, create room */
  ctrl.createRoom = function() {
    var startsAt = stateService.data['createRoom']['startDate'].jsDateObj;
    $scope.room.startsAt = startsAt;
    var payload = angular.copy($scope.room);
    payload.host = angular.copy($scope.user);
    ctrl.saveRoom(payload);
  };

  /* then save the room to mongo */
  ctrl.saveRoom = function(payload) {
    sessionApi.saveRoom(payload).then(function(response) {
      console.log('onSaveRoom', response);
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
    ctrl.renderTable();
  };

  /* render table (or re-render after save room) */
  ctrl.renderTable = function() {
    $scope.showTable = true;
    var sessions = localStorageService.get('sessions');
    if (sessions && sessions.length) {
      dataService.generateTable(sessions, function(table) {
        stateService.data['Session'].table = table;
        $scope.table = table;
        getStatus();
      });
    };
  };

  ctrl.renderMessage = function(binding, message) {
    $scope[binding] = message;
    $scope.$apply();
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
      ctrl.renderTable();
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
      ctrl.renderTable();
    }, 350);
  };

  ctrl.connect = function(otSession) {
    localStorageService.set('otSession', otSession);
    var opts = {
      user_id: $scope.user._id
    };
    $state.go('session', opts);
  };

  DashCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'socket', 'ngDialog', 'stateService', 'pubSub', 'userApi', 'sessionApi', 'animator', 'dataService', 'localStorageService'];
}
