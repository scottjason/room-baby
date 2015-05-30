'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', SessionCtrl);

function SessionCtrl($scope, $rootScope, $state, $window, $timeout, ngDialog, UserApi, PubSub, Transport, localStorageService) {

  var ctrl = this;
  var now = moment(new Date()).calendar();
  $rootScope.connectionCount = 0;

  var layoutContainer = document.getElementById('layout-container');
  var layout = TB.initLayoutContainer(layoutContainer, {
    animate: {
      duration: 500,
      easing: 'swing'
    },
    bigFixedRatio: false
  }).layout;

  $window.onresize = function() {
    var resizeCams = function() {
      layout();
      $timeout.cancel(promise);
    }
    var promise = $timeout(resizeCams, 20);
  };

  /* UI Responders */
  this.sendMessage = function() {
    if ($rootScope.connectionCount < 2) {
      $scope.user.message = '';
      console.log('need to be connected to another user');
      return;
    }
    var obj = {};
    obj.sentBy = $scope.user.username;
    obj.message = $scope.user.message;
    $scope.user.message = '';
    var timeSent = angular.copy(now);
    timeSent = timeSent.split(' ');
    timeSent.splice(0, 2);
    timeSent = timeSent.join(' ');
    obj.timeSent = timeSent;
    obj.profileImage = $scope.user.profileImage || 'https://raw.githubusercontent.com/scottjason/room-baby/master/client/assets/img/image-default-one.jpg';
    var messageString = JSON.stringify(obj);
    ctrl.broadcast('message', messageString);
  };

  this.init = function() {
    $scope.user = localStorageService.get('user');
    $scope.otSession = localStorageService.get('otSession');
    PubSub.on('shareFile', ctrl.shareFile);
    PubSub.on('requestPermission', ctrl.requestPermission);
    PubSub.on('disconnect', ctrl.disconnect);
    PubSub.on('openUpload', ctrl.openUpload);
    PubSub.on('closeUpload', ctrl.closeUpload);
    PubSub.trigger('toggleNavBar', true);
    PubSub.trigger('toggleFooter', true);
    PubSub.trigger('setUser', $scope.user);
    ctrl.createSession($scope.otSession);
  };

  this.isPermissionGranted = function(isGranted) {
    console.log('isGranted', isGranted);
  };

  ctrl.createSession = function(otSession) {
    if (OT.checkSystemRequirements() === 0) {
      console.error('The client does not support WebRTC.');
    } else {
      $scope.session = OT.initSession(otSession.key, otSession.sessionId);
      ctrl.registerEvents(otSession);
    }
  };

  ctrl.registerEvents = function(otSession) {
    $scope.session.on('connectionCreated', function(event) {
      console.log('connectionCreated');
      $rootScope.connectionCount++
        if (event.connection.creationTime < $scope.session.connection.creationTime) {
          $scope.connectionObj = event.connection;
          console.debug('on connectionCreated condition one');
        }
      if (event.connection.creationTime > $scope.session.connection.creationTime) {
        $scope.connectionObj = event.connection;
        console.debug('on connectionCreated condition two');
      }
      if ($rootScope.connectionCount !== 1) {
        ctrl.emit('connected', $scope.user.username);
      }
    });

    $scope.session.on('streamCreated', function(event) {
      console.debug('streamCreated');
      $scope.session.subscribe(event.stream, 'layout-container', {
        insertMode: 'append'
      });
      layout();
    });

    $scope.session.on('streamDestroyed', function(event) {
      console.debug('Stream ' + event.stream.name + ' ended. ' + event.reason);
    });

    $scope.session.on('sessionDisconnected', function(event) {
      $rootScope.connectionCount--;
      console.debug('sessionDisconnected');
      var opts = {
        user_id: $scope.user._id
      }
      ctrl.routeToDashboard(opts);
    });

    $scope.session.on('connectionDestroyed', function(event) {
      $rootScope.connectionCount--;
      console.debug('connection destroyed.');
    });

    $scope.session.on('signal:connected', function(event) {
      var connectedWith = event.data;
      var sessionStartedAt = moment().calendar();
      localStorageService.set('connectedWith', connectedWith);
      localStorageService.set('sessionStartedAt', sessionStartedAt);
      Transport.connected(connectedWith, sessionStartedAt);
    });

    $scope.session.on('signal:message', function(event) {
      var obj = JSON.parse(event.data);
      var sentBy = obj.sentBy;
      var message = obj.message;
      var timeSent = obj.timeSent;
      var profileImage = obj.profileImage;
      Transport.render(sentBy, message, profileImage, timeSent);
    });

    $scope.session.on('signal:permissionRequest', function(event) {
      var permissionRequestBy = event.data;
      if ($scope.user.username !== permissionRequestBy) {
        Transport.requestPermission(permissionRequestBy, function() {
          document.getElementById('permission-granted').addEventListener('click', ctrl.onPermissionResponse, false);
          document.getElementById('permission-denied').addEventListener('click', ctrl.onPermissionResponse, false);
        })
      } else {
        // Transport.permissionRequestSent();
      }
    });

    $scope.session.on('signal:permissionResponse', function(event) {
      var isGranted = (event.data).indexOf('granted') !== -1;
      if (isGranted) {
        Transport.sendReceipt('recordingPermission', true);
      } else {
        Transport.sendReceipt('recordingPermission', null);
      }
    });

    $scope.session.on('signal:file', function(event) {
      var data = JSON.parse(event.data);
      var sentBy = data.sentBy;
      var fileUrl = data.fileUrl;
      var timeSent = data.timeSent;
      if (sentBy !== $scope.user.username) {
        Transport.sendFile(sentBy, fileUrl, timeSent);
      } else {
        Transport.sendReceipt('fileShared');
      }
    });

    ctrl.createConnection(otSession);
  };

  ctrl.onPermissionResponse = function(event) {
    if (event.target.id === 'permission-granted') {
      ctrl.broadcast('permissionResponse', 'granted');
    } else {
      ctrl.broadcast('permissionResponse', 'denied');
    }
  };

  ctrl.createConnection = function(otSession) {
    $scope.session.connect(otSession.token, function(err) {
      if (err) {
        console.error('error connecting: ', err.code, err.message);
        return;
      };
      var elem = document.createElement("div");
      $scope.publisher = OT.initPublisher(elem, {
        resolution: "1280x720"
      }, function(err) {
        console.error(err);
        layout();
      });
      $scope.session.publish($scope.publisher);
      layoutContainer.appendChild(elem);
      layout();
    });
  };

  ctrl.requestPermission = function() {
    var permissionRequestedBy = $scope.user.username;
    ctrl.broadcast('permissionRequest', permissionRequestedBy);
  };

  ctrl.openUpload = function() {
    ngDialog.openConfirm({
      template: '../../views/ngDialog/upload.html',
      controller: 'FooterCtrl'
    });
  };

  ctrl.closeUpload = function() {
    ngDialog.closeAll();
  };

  ctrl.shareFile = function(fileUrl) {
    var obj = {};
    obj.sentBy = $scope.user.username;
    obj.fileUrl = fileUrl;
    var timeSent = angular.copy(now);
    timeSent = timeSent.split(' ');
    timeSent.splice(0, 2);
    timeSent = timeSent.join(' ');
    obj.timeSent = timeSent;
    var messageString = JSON.stringify(obj);
    ctrl.broadcast('file', messageString);
  };

  ctrl.disconnect = function() {
    $scope.session.disconnect();
  };

  ctrl.routeToDashboard = function(opts) {
    $state.go('dashboard', opts);
  };

  ctrl.emit = function(type, message) {
    $scope.session.signal({
      to: $scope.connectionObj,
      type: type,
      data: message,
    }, function(err) {
      if (err) console.error('signal error ( ' + err.code + ' ) : ' + err.reason);
    });
  };

  ctrl.broadcast = function(type, message) {
    $scope.session.signal({
      type: type,
      data: message,
    }, function(err) {
      if (err) console.error('signal error ( ' + err.code + ' ) : ' + err.reason);
    });
  };
  SessionCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'ngDialog', 'UserApi', 'PubSub', 'Transport', 'localStorageService'];
}
