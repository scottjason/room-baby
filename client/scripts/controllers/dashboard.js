'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $timeout, $window, socket, ngDialog, stateService, pubSub, userApi, sessionApi, animator, dataService, localStorageService) {

  var ctrl = this;
  var cleanRoom = {
    title: '',
    guestEmail: '',
    startDate: '',
    startTime: ''
  };

  socket.on('activateUser', function(session) {
    console.log('activateUser SessionCtrl', session);
  });

  socket.on('inviteReceived', function(session) {
    console.log('inviteReceived SessionCtrl', session);
  });

  $scope.room = {};


  $scope.createRoomTitle = 'please enter a name for the room';
  $scope.createRoomEmail = 'the email address of your guest';
  $scope.createRoomDate = 'and a start date and start time for the session';

  /* DOM Event Listeners */
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
    pubSub.on('dashCtrl:onInviteReady', ctrl.onInviteReady);
  };

  this.options = function($event, otSession) {
    if ($event.currentTarget.name === 'connect') {
      ctrl.connect(otSession);
    } else if ($event.currentTarget.id === 'on-create-room-submit') {
      ctrl.createRoom();
    }
  };

  this.onTimeSet = function(newDate, oldDate) {
    var startsAt;
    if (newDate) {
      var deepCopy = angular.copy(newDate);
      startsAt = moment(newDate).format('MMMM Do YYYY, h:mm:ss a');
      stateService.data['createRoom']['startDate'].text = startsAt;
      stateService.data['createRoom']['startDate'].utc = deepCopy;
      $scope.createRoomDate = 'Selcted Start Time: ' + startsAt;
      $scope.room.isTimeSet = true;
    } else if (oldDate) {
      var deepCopy = angular.copy(newDate);
      startsAt = moment(oldDate).format('MMMM Do YYYY, h:mm:ss a');
      stateService.data['createRoom']['startDate'].text = startsAt;
      stateService.data['createRoom']['startDate'].utc = deepCopy;
      $scope.createRoomDate = 'Selcted Start Time: ' + startsAt;
      $scope.room.isTimeSet = true;

    } else {
      stateService.data['createRoom']['startDate'].isSet = false;
      $scope.room.startsAt = false;
      $scope.room.isTimeSet = false;
    }
  };

  /* Controller Methods */

  ctrl.onInviteReady = function() {
    $scope.renderInviteBtn = true;
  };


  ctrl.createRoom = function() {
    var startsAt = stateService.data['createRoom']['startDate'].text;
    var startsAtUtc = stateService.data['createRoom']['startDate'].utc;
    var startsAtObj = moment(startsAtUtc);
    delete $scope.room.isSet;
    $scope.room.startsAt = startsAt;
    $scope.room.startsAtObj = startsAtObj;
    ctrl.saveRoom($scope.room);
  };

  ctrl.saveRoom = function(payload) {
    sessionApi.saveRoom(payload).then(function(response) {
      console.log('onSaveRoom', response);
    }, function(err){
      console.log(err)
    });
  };

  ctrl.addRoom = function(newRoom) {
    var sessions = localStorageService.get('sessions');
    sessions.push(newRoom);
    localStorageService.set('sessions', sessions);
    $scope.showLoading = false;
    ctrl.renderTable();
  };

  ctrl.renderTable = function() {
    $scope.showTable = true;
    var sessions = localStorageService.get('sessions');
    if (sessions && sessions.length) {
      dataService.generateTable(sessions, function(table) {
        $scope.table = table;
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
