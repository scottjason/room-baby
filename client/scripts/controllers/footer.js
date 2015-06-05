'use strict';

angular.module('RoomBaby')
  .controller('FooterCtrl', FooterCtrl);

function FooterCtrl($scope, $rootScope, $timeout, PubSub, SessionApi) {

  var ctrl = this;
  var promise;
  var fileUrl;

  $scope.user = {};

  this.registerEvents = function() {
    PubSub.on('toggleFooter', ctrl.toggleFooter);
    PubSub.on('setUser', ctrl.setUser);
  };

  this.submitUserName = function() {
    PubSub.trigger('setUserName', $scope.user.username);
  };

  this.options = function(type) {
    if (!$rootScope.connectionCount || $rootScope.connectionCount < 2) {
      return;
    }
    if (type === 'disconnect') {
      PubSub.trigger('disconnect');
    } else if (type === 'record') {
      PubSub.trigger('requestPermission');
    } else if (type === 'stop') {
      PubSub.trigger('stopRecording');
    } else if (type === 'upload') {
      PubSub.trigger('toggleOverlay');
      PubSub.trigger('toggleUpload', true);
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
      SessionApi.upload($scope.fileUpload, $scope.user._id, $scope.user._id).then(function(response) {
        if (response.status === 200) {
          fileUrl = response.data;
          $scope.showLoadingSpinner = false;
          PubSub.trigger('toggleOverlay');
          PubSub.trigger('toggleUpload', null);
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
    $scope.showFooter = showFooter;
  };

  ctrl.shareFile = function() {
    console.log('promise', promise);
    PubSub.trigger('shareFile', fileUrl);
    $timeout.cancel(promise);
  };

  FooterCtrl.$inject['$scope', '$rootScope', '$timeout', 'PubSub', 'SessionApi'];
}
