'use strict';

angular.module('RoomBaby')
  .controller('FooterCtrl', FooterCtrl);

function FooterCtrl($scope, $rootScope, $timeout, PubSub, SessionApi, Animator, localStorageService) {

  var ctrl = this;

  $scope.$watch('showFeatureDisabled', function() {
    if ($scope.showFeatureDisabled) {
      $timeout(function() {
        $scope.showFeatureDisabled = false;
      }, 2600);
    }
  });

  this.registerEvents = function() {
    PubSub.on('toggleFooter', ctrl.toggleFooter);
    PubSub.on('setUser', ctrl.setUser);
    PubSub.on('isRecording', ctrl.isRecording);
    PubSub.on('featureDisabled', ctrl.featureDisabled);
    PubSub.on('generatingVideo', ctrl.onGeneratingVideo);
  };

  this.onUserName = function() {
    console.log('onset username in footer.js');
    PubSub.trigger('setUserName', $scope.user.username);
  };

  this.onRegister = function() {
    console.log('onRegister', $scope.user);
  };

  this.onOptSelected = function(optSelected) {
    var isEnabled = ($rootScope.connectionCount > 1)
    if (optSelected === 'disconnect') {
      PubSub.trigger('disconnect');
    } else if (!isEnabled) {
      $scope.showFeatureDisabled = true;
    } else if (optSelected === 'record') {
      PubSub.trigger('requestPermission');
    } else if (optSelected === 'stop') {
      PubSub.trigger('stopRecording');
    } else if (optSelected === 'upload') {
      PubSub.trigger('toggleOverlay');
      PubSub.trigger('toggleUpload', true);
    } else if (optSelected === 'stop') {
      PubSub.trigger('stopRecording');
    }
  };

  this.collectUpload = function() {

    if (!$scope.fileUpload) {
      console.error('!$scope.fileUpload');
    } else if ($scope.fileUpload.size > 5e+6) { /* 5e+6 bytes === 5mb */
      console.error('maxSizeExceeded');
    } else {
      $scope.showLoadingSpinner = true;

      var sessionId = localStorageService.get('otSession').sessionId;
      var userId = localStorageService.get('user')._id;

      /* Verify again on server along with file type */
      SessionApi.upload($scope.fileUpload, userId, sessionId).then(function(response) {
        console.log('response', response);
        if (response.status === 200) {
          $scope.fileUrl = response.data;
          $scope.showLoadingSpinner = false;
          PubSub.trigger('toggleOverlay');
          PubSub.trigger('toggleUpload', null);
          $timeout(ctrl.shareFile, 700);
        } else if (response.status === 401) {
          console.error(401, response)
        }
      }, function(err) {
        console.error(err);
      });
    }
  };

  ctrl.setUser = function(user) {
    $scope.user = user;
  };

  ctrl.toggleFooter = function(showFooter) {
    $scope.showFooter = showFooter;
    if (showFooter) {
      var obj = {};
      obj.type = 'onFooterOverlay';
      obj.callback = onSuccess;
      Animator.run(obj)
      function onSuccess() {
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      }
    }
  };

  ctrl.isRecording = function(isRecording) {
    $scope.isRecording = isRecording;
  };

  ctrl.shareFile = function() {
    PubSub.trigger('shareFile', $scope.fileUrl);
  };

  ctrl.featureDisabled = function() {
    $scope.showFeatureDisabled = true;
  };

  ctrl.onGeneratingVideo = function(_bool) {
    $scope.showGeneratingVideo = _bool;
  }

  FooterCtrl.$inject['$scope', '$rootScope', '$timeout', 'PubSub', 'SessionApi', 'Animator', 'localStorageService'];
}
