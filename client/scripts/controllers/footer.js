'use strict';

angular.module('RoomBaby')
  .controller('FooterCtrl', FooterCtrl);

function FooterCtrl($scope, $rootScope, $timeout, pubSub, sessionApi, animator) {

  var ctrl = this;
  var promise;
  var fileUrl;

  $scope.user = {};

  $scope.$watch('showFeatureDisabled', function() {
    if ($scope.showFeatureDisabled) {
      $timeout(function() {
        $scope.showFeatureDisabled = false;
      }, 2600);
    }
  });

  this.registerEvents = function() {
    pubSub.on('toggleFooter', ctrl.toggleFooter);
    pubSub.on('setUser', ctrl.setUser);
  };

  this.onUserName = function() {
    pubSub.trigger('setUserName', $scope.user.username);
  };

  this.onRegister = function() {
    console.log('onRegister', $scope.user);
  };

  this.options = function(type) {
    var isEnabled = ($rootScope.connectionCount > 1)
    if (type === 'disconnect') {
      pubSub.trigger('disconnect');
    } else if (!isEnabled) {
      $scope.showFeatureDisabled = true;
      console.log('feature not yet enabled');
    } else if (type === 'record') {
      pubSub.trigger('requestPermission');
    } else if (type === 'stop') {
      pubSub.trigger('stopRecording');
    } else if (type === 'upload') {
      pubSub.trigger('toggleOverlay');
      pubSub.trigger('toggleUpload', true);
    }
  };

  this.collectUpload = function() {
    if (!$scope.fileUpload) {
      console.error('!$scope.fileUpload');
    } else if ($scope.fileUpload.size > 5e+6) { /* 5e+6 bytes === 5mb */
      console.error('maxSizeExceeded');
    } else {
      $scope.showLoadingSpinner = true;
      /* Verify again on server along with file type */
      sessionApi.upload($scope.fileUpload, $scope.user._id, $scope.user._id).then(function(response) {
        if (response.status === 200) {
          fileUrl = response.data;
          $scope.showLoadingSpinner = false;
          pubSub.trigger('toggleOverlay');
          pubSub.trigger('toggleUpload', null);
          promise = $timeout(ctrl.shareFile, 700);
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
    if (showFooter) {
      $scope.showFooter = showFooter;
      var obj = {};
      obj.type = 'onFooterOverlay';
      obj.callback = onSuccess;
      animator.run(obj)

      function onSuccess() {
        $scope.$apply();
      }
    } else {
      $scope.showFooter = showFooter;
    }
  };

  ctrl.shareFile = function() {
    pubSub.trigger('shareFile', fileUrl);
    $timeout.cancel(promise);
  };

  FooterCtrl.$inject['$scope', '$rootScope', '$timeout', 'pubSub', 'sessionApi', 'animator'];
}
