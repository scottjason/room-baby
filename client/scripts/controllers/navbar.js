'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $rootScope, $state, $timeout, $window, StateService, UserApi, PubSub, ngDialog, localStorageService) {

  var ctrl = this;

  $scope.user = localStorageService.get('user');

  this.registerEvents = function() {
    $scope.fadeToBlack = false;
    PubSub.on('toggleNavBar', ctrl.toggleNavBar);
    PubSub.on('toggleOverlay', ctrl.toggleOverlay);
    PubSub.on('onBroadcast', ctrl.onBroadcast);
    PubSub.on('setUser', ctrl.setUser);
    PubSub.on('cancelUsername', ctrl.logout);
    PubSub.on('timeLeft', ctrl.setTimeLeft);
    StateService.data['Controllers'].Navbar.isReady = true;
  };

  this.createRoom = function() {
    PubSub.trigger('Dashboard:CreateRoom');
  };

  this.dropdown = function(opt) {
    console.log('opt', opt)
    if (opt === 'logout') {
      var userId = localStorageService.get('user')._id;
      ctrl.logout(userId);
    } else if (opt === 'upload') {
      ctrl.toggleUpload(null);
    }
  };

  this.setTimeLeft = function(timeLeft, thirtySecondsLeft, twentySecondsLeft) {
    $scope.timeLeft = ($rootScope.isDissconected || timeLeft === '0 minutes and 0 seconds left') ? '' : timeLeft;
    $scope.thirtySecondsLeft = thirtySecondsLeft;
    $scope.twentySecondsLeft = twentySecondsLeft;
  };

  this.isThirtySecondsLeft = function() {
    if ($rootScope.isDissconected || $scope.twentySecondsLeft) {
      return false;
    } else {
      return $scope.thirtySecondsLeft;
    }
  };

  this.isTwentySecondsLeft = function() {
    if ($rootScope.isDissconected) {
      return false;
    } else if ($rootScope.isRecording && $scope.twentySecondsLeft) {
      $rootScope.isRecording = false;
      PubSub.trigger('stopRecording');
      return true;
    } else if ($scope.twentySecondsLeft) {
      return true;
    }
  };

  this.getTimeLeft = function() {
    return $scope.timeLeft || '';
  };

  this.getProfileImg = function() {
    if (localStorageService.get('user')) {
      return localStorageService.get('user').profileImage;
    }
  };

  this.getUserName = function() {
    if (localStorageService.get('user')) {
      return localStorageService.get('user').username;
    } else {
      return '';
    }
  };


  this.collectUpload = function() {

    if (!$scope.fileUpload) {
      console.error('!$scope.fileUpload');
    } else if ($scope.fileUpload.size > 5e+6) { /* 5e+6 bytes === 5mb */
      console.error('maxSizeExceeded');
    } else {
      $scope.showLoadingSpinner = true;

      var userId = localStorageService.get('user')._id;

      /* Verify again on server along with file type */
      UserApi.upload($scope.fileUpload, userId).then(function(response) {
        if (response.status === 200) {
          var user = localStorageService.get('user');
          user.profileImage = response.data;
          localStorageService.set('user', user);
          $scope.showLoadingSpinner = false;
          ctrl.toggleUpload(true);
        } else if (response.status === 401) {
          console.error(401, response)
        }
      }, function(err) {
        console.error(err);
      });
    }
  };

  ctrl.toggleUpload = function(isOpen) {
    if (!isOpen) {
      ngDialog.openConfirm({
        template: '../../views/ngDialog/profile-image.html',
        controller: 'NavBarCtrl'
      });
    } else {
      ngDialog.closeAll();
    }
  };

  ctrl.onBroadcast = function() {
    $scope.showBroadcast = true;
  };

  ctrl.toggleOverlay = function() {
    $scope.showOverlay = !$scope.showOverlay;
  };

  ctrl.toggleNavBar = function(_bool) {
    $scope.showNavBar = _bool;
  };

  ctrl.setUser = function(user) {
    $scope.user = user;
  };

  ctrl.logout = function(user_id) {
    PubSub.trigger('logout');
    UserApi.logout(user_id).then(function(response) {
      localStorageService.clearAll();
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  NavBarCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'StateService', 'UserApi', 'PubSub', 'ngDialog', 'localStorageService'];
}
