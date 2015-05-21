'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $timeout, $window, ngDialog, PubSub, UserApi, SessionApi, Animation, localStorageService) {
  var vm = this;

  $timeout(function() {
    init();
  }, 400);

  function init() {
    $scope.user = localStorageService.get('user');
    if ($scope.user && $scope.user.username) {
      Animation.run('onDashboard');
    } else {
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
      })
    }
  };

  /*
   * UI Responders
   **/
  this.registerEvents = function() {
    PubSub.on('setUserName', vm.setUserName);
  };

  this.isAuthenticated = function() {
    if (!localStorageService.get('dashboardLoaded')) {
      if (localStorageService.get('facebookLogin')) {
        var user_id = $state.params.user_id
        UserApi.getAll(user_id).then(function(response) {
          if (response.status === 200 && !response.data.session) {
            var user = response.data.user;
            localStorageService.set('user', user);
            PubSub.trigger('setUser', user);
            vm.onSuccess(user, null);
          } else if (response.status === 200) {
            var user = response.data.user;
            var session = response.data.session;
            localStorageService.set('user', user);
            localStorageService.set('session', session);
            PubSub.trigger('setUser', user);
            PubSub.trigger('toggleNavBar', true);
            PubSub.trigger('toggleFooter', true);
            vm.onSuccess(user, session);
          } else if (response.status === 401) {
            PubSub.trigger('toggleNavBar', null);
            PubSub.trigger('toggleFooter', null);
            localStorageService.clearAll();
            $state.go('landing');
          } else {
            localStorageService.clearAll();
            $window.location.href = $window.location.origin;
          }
        }, function(err) {
          console.log(err);
        })
      } else {
        UserApi.isAuthenticated().then(function(response) {
          if (response.status === 200 && !response.data.session) {
            var user = response.data.user;
            localStorageService.set('user', user);
            PubSub.trigger('setUser', user);
            PubSub.trigger('toggleNavBar', true);
            PubSub.trigger('toggleFooter', true);
            vm.onSuccess(user, null);
          } else if (response.status === 200) {
            var user = response.data.user;
            var session = response.data.session;
            localStorageService.set('user', user);
            localStorageService.set('session', session);
            PubSub.trigger('setUser', user);
            PubSub.trigger('toggleNavBar', true);
            PubSub.trigger('toggleFooter', true);
            vm.onSuccess(user, session);
          } else if (response.status === 401) {
            PubSub.trigger('toggleNavBar', null);
            PubSub.trigger('toggleFooter', null);
            localStorageService.clearAll();
            $state.go('landing');
          } else {
            localStorageService.clearAll();
            $window.location.href = $window.location.origin;
          }
        }, function(err) {
          console.log(98)
          console.error(err);
        });
      }
    } else {
      vm.handleRefresh();
    }
  };

  this.options = function($event, otSession) {
    console.log($event);
    if ($event.currentTarget.name === 'connect') {
      vm.connect(otSession);
    } else if ($event.currentTarget.innerHTML === 'create a room') {
      $scope.showCreateRoom = true;
    } else if ($event.currentTarget.innerHTML === 'create a broadcast') {
      $scope.showCreateBroadcast = true;
    }
  };

  /*
   * Controller Methods
   **/

  vm.onSuccess = function(user, session) {
    $scope.user = user
    if (session) {
      $scope.session = session;
    }
    if (!$scope.user.username) {
      PubSub.trigger('toggleNavBar', null);
      PubSub.trigger('toggleFooter', null);
      vm.getUserName();
    } else {
      PubSub.trigger('toggleNavBar', true);
      PubSub.trigger('toggleFooter', true);
      vm.renderTable();
    }
  };

  vm.renderTable = function() {
    if (!$scope.session && localStorageService.get('session')) {
      $scope.session = localStorageService.get('session');
    }
    if ($scope.session && $scope.session.length) {
      $scope.allSessions = [];
      $scope.session.forEach(function(elem) {
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
    localStorageService.set('dashboardLoaded', true);
  };

  vm.handleRefresh = function() {
    $scope.user = localStorageService.get('user');
    PubSub.trigger('setUser', $scope.user);
    PubSub.trigger('toggleNavBar', true);
    PubSub.trigger('toggleFooter', true);
    if (localStorageService.get('session')) {
      $scope.session = localStorageService.get('session');
      vm.renderTable();
    }
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
      var user = response.data;
      PubSub.trigger('setUser', user);
      $scope.user = user;
      localStorageService.set('user', user);
      $scope.usernameConfirmed = true;
      localStorageService.remove('facebookLogin');
    })
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
