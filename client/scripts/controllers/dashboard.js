'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $timeout, $window, socket, ngDialog, pubSub, userApi, sessionApi, animator, dataService, localStorageService) {

  var ctrl = this;
  var cleanRoom = { title: '', guestEmail: '', startDate: '', startTime: '' };

  socket.on('activateUser', function(session){
    console.log('activateUser SessionCtrl', session);
  });

  socket.on('inviteReceived', function(session){
    console.log('inviteReceived SessionCtrl', session);
  });

    $scope.room = {};
    $scope.room.startDate = new Date();

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
  };

  this.options = function($event, otSession) {
    if ($event.currentTarget.name === 'connect') {
      ctrl.connect(otSession);
    } else if ($event.currentTarget.innerHTML === 'create a room') {
      // $scope.showCreateRoom = true;
    } else if ($event.currentTarget.innerHTML === 'create a broadcast') {
      $scope.showCreateBroadcast = true;
    } else if ($event.target.id === 'on-create-room-submit') {
      console.log('on-create-room-submit');
      console.log($scope.room);
    }
  };

  // this.createRoomOpt = function($event) {
  //   if ($event.currentTarget.name === 'cancel') {
  //     $scope.invitedUser = angular.copy(cleanRoom);
  //     $scope.roomForm.$setPristine();
  //     $scope.showCreateRoom = false;
  //     $scope.showNext = false;
  //   } else if ($event.currentTarget.name === 'next') {
  //     $scope.showCreateRoom = false;
  //     $scope.showNext = true;
  //   } else if ($event.currentTarget.name === 'create') {
  //     $scope.showNext = false;
  //     $scope.showLoading = true;
  //     var invitedUser = angular.copy($scope.invitedUser);
  //     $scope.invitedUser = cleanRoom;
  //     $scope.roomForm.$setPristine();
  //     ctrl.createRoom($scope.user, invitedUser);
  //   }
  // };

  /* Controller Methods */
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

  ctrl.createRoom = function(connectedUser, invitedUser) {
    var payload = {};
    payload.connectedUser = connectedUser;
    payload.invitedUser = invitedUser;
    sessionApi.create(payload).then(function(response) {
      if (response.status === 200) {
        ctrl.addRoom(response.data.session);
      }
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
      dataService.generateTable(sessions, function(table){
        $scope.table = table;
      });
    };
  };

  ctrl.connect = function(otSession) {
    localStorageService.set('otSession', otSession);
    var opts = { user_id: $scope.user._id };
    $state.go('session', opts);
  };

  DashCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'socket', 'ngDialog', 'pubSub', 'userApi', 'sessionApi', 'animator', 'dataService', 'localStorageService'];
}
