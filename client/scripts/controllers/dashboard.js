'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $stateParams, $timeout, $window, ngDialog, ConstantService, StateService, PubSub, UserApi, SessionApi, Animator, TimeService, localStorageService) {

  var ctrl = this;
  $scope.room = {};
  var counter = 0;

  var fiveMinutes = 300000;
  StateService.data['Facebook'].shareDialog.isOpen = false;

  PubSub.trigger('dashboardLoaded');

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
        $scope.user = localStorageService.get('user') || [];
        $scope.sessions = localStorageService.get('sessions') || [];
        $scope.archives = localStorageService.get('archives') || [];
        ctrl.initialize();
      } else {
        localStorageService.clearAll();
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }
    }, function(err) {
      localStorageService.clearAll();
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  this.registerEvents = function() {
    PubSub.on('setUserName', ctrl.setUserName);
    PubSub.on('renderTable', ctrl.renderTable);
    PubSub.on('createRoomOpt', ctrl.onCreateRoomOpt);
    PubSub.on('createRoom:renderMessage', ctrl.renderMessage);
    PubSub.on('createRoom:renderConfirmation', ctrl.renderConfirmation);
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

  this.clearForm = function() {
    $scope.room = {};
  };

  /* recursive method to get statuses of room */
  function getStatus() {
    if ($state.current.name === 'dashboard') {
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
  }

  /* Controller Methods */

  ctrl.initialize = function() {
    if (localStorageService.get('isFacebookLogin')) {
      StateService.data['Auth'].isFacebook = true;
      ctrl.onFacebookLogin($state.params.user_id);
    } else {
      ctrl.getSessions();
      ctrl.isExpired();
      PubSub.trigger('toggleNavBar', true);
      PubSub.trigger('setUser', $scope.user);
      var opts = Animator.generateOpts('onDashboard');
      Animator.run(opts);
      ctrl.renderTable();
    }
  };

  ctrl.isExpired = function() {
    TimeService.checkExpiration();
  };

  ctrl.getSessions = function() {

    if (!localStorageService.get('sessions')) {
      localStorageService.set('sessions', []);
    }

    var lengthBefore = localStorageService.get('sessions').length;

    SessionApi.getAll($scope.user._id).then(function(response) {
      if (response.data.sessions) {
        var lengthAfter = response.data.sessions.length;
        if (lengthAfter > lengthBefore) {
          localStorageService.set('sessions', response.data.sessions);
          ctrl.renderTable();
        }
      }
    });
    if ($state.current.name === 'dashboard') {
      $timeout(ctrl.getSessions, 1500);
    }
  };

  ctrl.renderConfirmation = function() {
    var opts = {
      type: 'onRenderConfirmation'
    };
    Animator.run(opts, function() {
      $scope.showConfirmation = true;
    });
  };

  ctrl.onCreateRoomOpt = function(isNow) {
    if (isNow) {
      var isValidName = StateService.data['createRoom']['name'].isValid;
      var isValidEmail = StateService.data['createRoom']['guestEmail'].isValid;
      if (isValidName && isValidEmail) {
        $scope.room.isTimeSet = true;
        $scope.room.startsAt = new Date().getTime();
        $scope.room.startsAtFormatted = moment(new Date().getTime()).format("dddd, MMMM Do YYYY, h:mm a");
        $scope.room.expiresAt = (new Date().getTime() + fiveMinutes);
        StateService.data['createRoom']['formData'].isValid = true;
        $scope.room.startsAt = new Date().getTime();
        ctrl.renderConfirmation();
      }
    } else {
      var opts = {
        type: 'onShowCalendar'
      };
      Animator.run(opts, function() {
        $scope.showCalendar = true;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });
    }
  };

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
    $scope.showCalendar = false;
    $scope.showLoading = true;
    var payload = angular.copy($scope.room);
    payload.host = angular.copy($scope.user);
    SessionApi.createRoom(payload).then(function(response) {
      var obj = {};
      obj.type = 'onOverlayExit';
      Animator.run(obj);
      $scope.showLoading = false;
      $timeout(function() {
        StateService.data['createRoom']['name'].text = '';
        StateService.data['createRoom']['guestEmail'].text = '';
        StateService.data['createRoom']['startDate'].isValid = false;
        StateService.data['createRoom']['name'].isValid = false;
        StateService.data['createRoom']['guestEmail'].isValid = false;
        StateService.data['createRoom']['formData'].isValid = false;
        StateService.data['overlay'].isOpen = false;
        $scope.room = {};
        $scope.showConfirmation = false;
      }, 1200);
    }, function(err) {
      console.log(err)
    });
  };

  /* render table (or re-render after save room) */
  ctrl.renderTable = function(isOnLoad) {
    counter++
    $scope.showTable = true;
    var sessions = localStorageService.get('sessions');
    var archives = localStorageService.get('archives');
    TimeService.generateTable(sessions, archives, function(table) {
      StateService.data['Session'].table = table;
      $timeout(function() {
        $scope.table = table;
      });
    });
    if (counter === 1) {
      getStatus();
    }
  };

  ctrl.renderMessage = function(binding, message) {
    $timeout(function() {
      $scope[binding] = message;
      $timeout(function() {
        $scope[binding] = '';
      }, 1600);
    });
  };

  ctrl.onFacebookLogin = function(user_id) {
    UserApi.getAll(user_id).then(function(response) {
      if (response.status === 200) {
        $scope.user = response.data.user;
        localStorageService.set('user', $scope.user);
        localStorageService.set('sessions', response.data.sessions || []);
        localStorageService.set('archives', response.data.archives || []);
        PubSub.trigger('setUser', $scope.user);
        if (!$scope.user.username) {
          ctrl.getUserName();
        } else {
          ctrl.getSessions();
          ctrl.isExpired();
          PubSub.trigger('toggleNavBar', true);
          var obj = {};
          obj.type = 'onDashboard';
          Animator.run(obj);
          ctrl.renderTable();
        }
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

  // ctrl.onFacebookSuccess = function(user, sessions) {
  //   $scope.user = user;
  //   if (sessions) {
  //     localStorageService.set('sessions', sessions);
  //   }
  //   if (!$scope.user.username) {
  //     ctrl.getUserName();
  //   } else {
  //     ctrl.getSessions();
  //     ctrl.isExpired();
  //     PubSub.trigger('toggleNavBar', true);
  //     var obj = {};
  //     obj.type = 'onDashboard';
  //     Animator.run(obj);
  //     ctrl.renderTable();
  //   }
  // };

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
      localStorageService.remove('isFacebookLogin');
      var user = response.data.user;
      PubSub.trigger('setUser', user);
      $scope.user = user;
      localStorageService.set('user', user);
      ctrl.onUserNameSuccess();
    });
  };

  ctrl.onUserNameSuccess = function() {
    ctrl.getSessions();
    ctrl.isExpired();
    ngDialog.closeAll();
    $timeout(function() {
      PubSub.trigger('toggleNavBar', true);
      var obj = {};
      obj.type = 'onDashboard';
      Animator.run(obj);
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

  DashCtrl.$inject['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$window', 'ngDialog', 'ConstantService', 'StateService', 'PubSub', 'UserApi', 'SessionApi', 'Animator', 'TimeService', 'localStorageService'];
}
