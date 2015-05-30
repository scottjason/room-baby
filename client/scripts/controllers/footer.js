'use strict';

angular.module('RoomBaby')
  .controller('FooterCtrl', FooterCtrl);

function FooterCtrl($scope, $rootScope, $timeout, PubSub, SessionApi) {
  var ctrl = this;
  $scope.user = {};

  this.registerEvents = function() {
    PubSub.on('toggleFooter', function(_bool) {
      $scope.showFooter = _bool;
    });

    PubSub.on('setUser', function(user) {
      $scope.user = user;
    });
  };

  this.submitUserName = function(data) {
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
    } else if (type === 'upload') {
      PubSub.trigger('toggleOverlay');
      PubSub.trigger('openUpload');
    }
  };

  this.collectUpload = function() {
    if (!$scope.fileUpload) {
      console.error('!$scope.fileUpload');
    } else if ($scope.fileUpload.size > 5e+6) { /* 5e+6 bytes === 5mb */
      console.error('maxSizeExceeded');
    } else {
      $scope.showLoadingSpinner = true;
      /* verify again on server along with file type */
      SessionApi.upload($scope.fileUpload, $scope.user._id, $scope.user._id).then(function(response) {
        if (response.status === 200) {
          var fileUrl = response.data;
          $scope.showLoadingSpinner = false;
          PubSub.trigger('toggleOverlay');
          PubSub.trigger('closeUpload');
          $timeout(function(){
          PubSub.trigger('shareFile', fileUrl);
          }, 700);
        } else if (response.status === 401) {
          console.log('401', response)
        }
      }, function(err) {
        console.log(err);
      });
    }
  };
  FooterCtrl.$inject['$scope', '$rootScope', '$timeout', 'PubSub', 'SessionApi'];
}
