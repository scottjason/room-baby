'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $state, $timeout, PubSub, UserApi, Animation, localStorageService) {

  var vm = this;

  $timeout(init, 500);

  function init() {
    Animation.run('onDashboard');
  };

  PubSub.on('Dashboard:CreateRoom', function() {
    $scope.createRoom = true;
  });

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200 && !response.data.session) {
        var user = response.data.user;
        localStorageService.set('user', user);
        PubSub.trigger('setUser', user);
        PubSub.trigger('toggleNavBar', true);
        PubSub.trigger('toggleFooter', true);
        vm.init(user, null);
      } else if (response.status === 200) {
        var user = response.data.user;
        var session = response.data.session;
        localStorageService.set('user', user);
        localStorageService.set('session', session);
        PubSub.trigger('setUser', user);
        PubSub.trigger('toggleNavBar', true);
        PubSub.trigger('toggleFooter', true);
        vm.init(user, session);
      } else if (response.status === 401) {
        PubSub.trigger('toggleNavBar', null);
        PubSub.trigger('toggleFooter', null);
        $state.go('landing');
      } else {
        console.error('unknown authentication status');
      }
    }, function(err) {
      console.error(err);
    });
  }

  vm.init = function(user, session) {
    $scope.user = user
    if (session) {
      $scope.session = session;
      vm.renderTable();
    }
  };

  this.options = function(obj) {
    console.log('obj', obj);
  };

  vm.renderTable = function() {
    $scope.allSessions = [];
    $scope.session.forEach(function(elem) {
      console.log(elem);
      var obj = {};
      obj.sessionId = elem.sessionId;
      obj.key = elem.key;
      obj.secret = elem.secret;
      obj.token = elem.token
      obj.name = elem.name;
      obj.createdBy = 'created by ' + elem.createdBy.username + ', ' + moment(elem.createdBy).calendar();
      obj.members = '';
      var lastIndex = elem.users.length - 1;
      elem.users.forEach(function(invitedUser, index) {
        if (index === lastIndex) {
          obj.members = obj.members + invitedUser.email;
        } else {
          obj.members = obj.members + invitedUser.email + ', ';
        }
      })
      obj.status = 'ready';
      obj.options = 'connect';
      $scope.allSessions.push(obj);
    });
  };

  DashCtrl.$inject['$scope', '$state', '$timeout', 'PubSub', 'UserApi', 'Animation', 'localStorageService'];
}
