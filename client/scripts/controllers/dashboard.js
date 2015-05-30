'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $timeout, $window, ngDialog, PubSub, UserApi, SessionApi, Animation, localStorageService) {

  var vm = this;
  var cleanForm = { title: '', email: '' };
  $scope.room = {};

  this.initialize = function() {
    console.log('Welcome To Room Baby!');
    if (localStorageService.get('isFacebookLogin')) {
      var user_id = $state.params.user_id
      vm.onFacebookLogin(user_id);
    } else if (!localStorageService.get('user')) {
      localStorageService.clearAll();
      $state.go('landing');
    } else {
      $scope.user = localStorageService.get('user');
      PubSub.trigger('setUser', $scope.user);
      PubSub.trigger('toggleNavBar', true);
      PubSub.trigger('toggleFooter', true);
      vm.renderTable();
      Animation.run('onDashboard');
    }
  };

  /*
   * UI Responders
   **/
  this.registerEvents = function() {
    PubSub.on('setUserName', vm.setUserName);
    $scope.$watch('usernameConfirmed', function() {
      if ($scope.usernameConfirmed) {
        ngDialog.closeAll();
        PubSub.trigger('toggleNavBar', true);
        PubSub.trigger('toggleFooter', true);
        $timeout(function() {
          Animation.run('onDashboard');
          vm.renderTable();
        }, 350)
      }
    });
  };

  this.options = function($event, otSession) {
    if ($event.currentTarget.name === 'connect') {
      vm.connect(otSession);
    } else if ($event.currentTarget.innerHTML === 'create a room') {
      $scope.showCreateRoom = true;
    } else if ($event.currentTarget.innerHTML === 'create a broadcast') {
      $scope.showCreateBroadcast = true;
    }
  };

  this.createRoomOpt = function($event) {
    if ($event.currentTarget.name === 'cancel') {
      $scope.invitedUser = angular.copy(cleanForm);
      $scope.roomForm.$setPristine();
      $scope.showCreateRoom = false;
      $scope.showNext = false;
    } else if ($event.currentTarget.name === 'next') {
      $scope.showCreateRoom = false;
      $scope.showNext = true;
    } else if ($event.currentTarget.name === 'create') {
      $scope.showNext = false;
      $scope.showLoading = true;
      var invitedUser = angular.copy($scope.invitedUser);
      $scope.invitedUser = cleanForm;
      $scope.roomForm.$setPristine();
      vm.createRoom($scope.user, invitedUser);
    }
  };

  /*
   * Controller Methods
   **/
  vm.onFacebookLogin = function(user_id) {
    UserApi.getAll(user_id).then(function(response) {
      console.log('response', response);
      if (response.status === 200 && !response.data.sessions) {
        var user = response.data.user;
        localStorageService.set('user', user);
        PubSub.trigger('setUser', user);
        vm.onFacebookSuccess(user, null);
      } else if (response.status === 200) {
        var user = response.data.user;
        var sessions = response.data.sessions;
        localStorageService.set('user', user);
        localStorageService.set('sessions', sessions);
        PubSub.trigger('setUser', user);
        PubSub.trigger('toggleNavBar', true);
        PubSub.trigger('toggleFooter', true);
        vm.onFacebookSuccess(user, sessions);
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

  vm.onFacebookSuccess = function(user, sessions) {
    console.log('onFacebookSuccess', user);
    $scope.user = user
    if (sessions) {
      console.debug('sessions', sessions);
      localStorageService.set('sessions', sessions);
    }
    if (!$scope.user.username) {
      PubSub.trigger('toggleNavBar', null);
      PubSub.trigger('toggleFooter', null);
      vm.getUserName();
    } else {
      PubSub.trigger('toggleNavBar', true);
      PubSub.trigger('toggleFooter', true);
      Animation.run('onDashboard');
      vm.renderTable();
    }
  };

  vm.createRoom = function(connectedUser, invitedUser) {
    var payload = {};
    payload.connectedUser = connectedUser;
    payload.invitedUser = invitedUser;
    SessionApi.create(payload).then(function(response) {
      if (response.status === 200) {
        vm.addRoom(response.data.session);
      }
    });
  };

  vm.addRoom = function(newRoom) {
    var sessions = localStorageService.get('sessions');
    sessions.push(newRoom);
    localStorageService.set('sessions', sessions);
    $scope.showLoading = false;
    vm.renderTable();
  };

  vm.renderTable = function() {
    $scope.showTable = true;
    var sessions = localStorageService.get('sessions');
    if (sessions && sessions.length) {
      $scope.allSessions = [];
      sessions.forEach(function(elem) {
        var obj = {};
        obj.sessionId = elem.sessionId;
        obj.key = elem.key;
        obj.secret = elem.secret;
        obj.token = elem.token
        obj.name = elem.name;
        obj.createdBy = 'created by ' + elem.createdBy.username + ', ' + (moment(elem.createdAt).calendar()).toLowerCase();
        var lastIndex = elem.users.length - 1;
        elem.users.forEach(function(invitedUser, index) {
          if (index === lastIndex) {
            obj.members = (obj.members || '') + invitedUser.email;
          } else {
            obj.members = (obj.members || '') + invitedUser.email + ', ';
          }
        })
        obj.status = 'ready';
        obj.options = 'connect';
        $scope.allSessions.push(obj);
      });
    };
  };

  /*
   * When a new user logs in through facebook, get and save a username before the dashboard renders
   **/
  vm.getUserName = function(callback) {
    ngDialog.openConfirm({
      template: '../../views/ngDialog/facebook.html',
      controller: 'FooterCtrl'
    });
  };

  vm.setUserName = function(username) {
    var payload = {};
    payload._id = $scope.user._id;
    payload.username = username;
    vm.saveUserName(payload);
  };

  vm.saveUserName = function(payload) {
    UserApi.saveUserName(payload).then(function(response) {
      localStorageService.remove('isFacebookLogin')
      var user = response.data.user;
      PubSub.trigger('setUser', user);
      $scope.user = user;
      localStorageService.set('user', user);
      $scope.usernameConfirmed = true;
    });
  };

  /*
   * Connect to the session
   **/

  vm.connect = function(otSession) {
    localStorageService.set('otSession', otSession);
    var opts = {
      user_id: $scope.user._id,
    }
    $state.go('session', opts);
  };

  DashCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'ngDialog', 'PubSub', 'UserApi', 'SessionApi', 'Animation', 'localStorageService'];
}
