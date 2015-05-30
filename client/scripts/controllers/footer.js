'use strict';

angular.module('RoomBaby')
  .controller('FooterCtrl', FooterCtrl);

function FooterCtrl($scope, $rootScope, PubSub, SessionApi) {
  var vm = this;
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
    if (type === 'disconnect') {
      PubSub.trigger('disconnect');
    } else if (type === 'record:start') {
      PubSub.trigger('record:start');
    }
  };

  this.collectUpload = function() {
    $scope.showUpload = false;
    if (!$scope.fileUpload) {
      console.error('!$scope.fileUpload');
    } else if ($scope.fileUpload.size > 5e+6) { /* 5e+6 bytes === 5mb */
      console.error('maxSizeExceeded');
    } else {
      /* verify again on server along with file type */
      SessionApi.upload($scope.fileUpload, $scope.user._id, $scope.user._id).then(function(response) {
        if (response.status === 200) {
          var fileUrl = response.data;
          PubSub.trigger('fileShare', fileUrl);
        } else if (response.status === 401) {
          console.log('401', response)
        }
      }, function(err) {
        console.log(err);
      });
    }
  };
  FooterCtrl.$inject['$scope', '$rootScope', 'PubSub', 'SessionApi'];
}
