'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', SessionCtrl);

function SessionCtrl($scope, $rootScope, $state, $window, $timeout, socket, ngDialog, UserApi, SessionApi, PubSub, Transport, localStorageService) {

  var ctrl = this;
  var promise;
  var now = moment(new Date()).calendar();

  $rootScope.connectionCount = 0;

  var chatbox = angular.element(document.getElementById('chatbox'));
  var transportContainer = document.getElementById('transport-container');
  var layoutContainer = document.getElementById('layout-container');
  var layoutOpts = { animate: { duration: 500, easing: 'swing' }, bigFixedRatio: false };
  var layout = TB.initLayoutContainer(layoutContainer, layoutOpts).layout;

  $window.onresize = function() {
    var resizeCams = function() {
      layout();
      $timeout.cancel(promise);
    }
    promise = $timeout(resizeCams, 20);
  };

  /* Client & Server PubSub */
  socket.on('videoStatus', function(isReady, video){
    if (isReady) {
      console.debug('Video Ready');
      localStorageService.set('video', video);
      console.log('GOT SOCKET VIDEO', video);
      var videoUrl = video.url;
      ctrl.broadcast('videoUrl', videoUrl);
    } else {
       console.debug('Video Not Ready');
       var archiveId = localStorageService.get('archive').id;
      ctrl.getVideoStatus(archiveId);
    }
  });

  /* Client Pub Sub */
  this.registerEvents = function() {
    $scope.user = localStorageService.get('user');
    $scope.otSession = localStorageService.get('otSession');
    PubSub.on('shareFile', ctrl.shareFile);
    PubSub.on('requestPermission', ctrl.requestPermission);
    PubSub.on('stopRecording', ctrl.stopRecording);
    PubSub.on('disconnect', ctrl.disconnect);
    PubSub.on('toggleUpload', ctrl.toggleUpload);
    PubSub.trigger('toggleNavBar', true);
    PubSub.trigger('toggleFooter', true);
    PubSub.trigger('setUser', $scope.user);
    ctrl.createSession($scope.otSession);
  };

  this.sendMessage = function() {
    if ($rootScope.connectionCount < 2) {
      $scope.user.message = '';
      console.log('need to be connected to another user');
    } else {
      var obj = {};
      obj.sentBy = $scope.user.username;
      obj.message = $scope.user.message;
      $scope.user.message = '';
      var timeSent = angular.copy(now);
      timeSent = timeSent.split(' ');
      timeSent.splice(0, 2);
      timeSent = timeSent.join(' ');
      obj.timeSent = timeSent;
      obj.profileImage = $scope.user.profileImage;
      var chatMessage = JSON.stringify(obj);
      ctrl.broadcast('chatMessage', chatMessage);
    }
  };

  ctrl.createSession = function(otSession) {
    if (OT.checkSystemRequirements() === 0) {
      console.error('The client does not support WebRTC.');
    } else {
      $scope.session = OT.initSession(otSession.key, otSession.sessionId);
      ctrl.registerSessionEvents(otSession);
    }
  };

  ctrl.registerSessionEvents = function(otSession) {
    $scope.session.on('connectionCreated', function(event) {
      console.log('connectionCreated');
      $rootScope.connectionCount++
        if (event.connection.creationTime < $scope.session.connection.creationTime) {
          localStorageService.set('connectionObj', event.connection);
          $scope.connectionObj = event.connection;
          console.debug('on connectionCreated condition one');
        }
      if (event.connection.creationTime > $scope.session.connection.creationTime) {
        $scope.connectionObj = event.connection;
      }
      if ($rootScope.connectionCount !== 1) {
        ctrl.emit('onConnected', $scope.user.username);
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

    $scope.session.on('signal:onConnected', function(event) {
      var obj = {};
      var connectedWith = event.data;
      var sessionStartedAt = angular.copy(now);
      obj.type = 'onConnected';
      obj.connectedWith = connectedWith;
      obj.sessionStartedAt = sessionStartedAt;
      localStorageService.set('connectedWith', connectedWith);
      localStorageService.set('sessionStartedAt', sessionStartedAt);
      Transport.generateHtml(obj, function(html) {
        chatbox.append(html);
      });
    });

    $scope.session.on('signal:chatMessage', function(event) {
      var obj = {};
      var data = JSON.parse(event.data);
      obj.type = 'chatMessage';
      obj.sentBy = data.sentBy;
      obj.message = data.message;
      obj.profileImage = data.profileImage;
      obj.timeSent = data.timeSent;
      Transport.generateHtml(obj, function(html) {
        chatbox.append(html);
        $timeout(scrollBottom, 100);
        function scrollBottom() {
          transportContainer.scrollTop = transportContainer.scrollHeight;
        };
      });
    });

    $scope.session.on('signal:requestPermission', function(event) {
      var obj = {};
      obj.type = 'requestPermission';
      obj.requestedBy = event.data;
      if (obj.requestedBy === $scope.user.username) {
        return false;
      }
      Transport.generateHtml(obj, function(html) {
        chatbox.append(html);
        $timeout(bindListeners, 100);
        function bindListeners() {
          document.getElementById('permission-granted').addEventListener('click', ctrl.onPermissionResponse, false);
          document.getElementById('permission-denied').addEventListener('click', ctrl.onPermissionResponse, false);
        };
      });
    });

    $scope.session.on('signal:permissionResponse', function(event) {
      var obj = {};
      obj.type = 'sendReceipt';
      obj.receiptType = 'permissionResponse';
      obj.isGranted = (event.data).indexOf('granted') !== -1;
      Transport.generateHtml(obj, function(html) {
        chatbox.append(html);
      });
    });

    $scope.session.on('signal:archive', function(event) {
      var archive = JSON.parse(event.data);
      localStorageService.set('archive', archive);
      console.log('archive saved');
    });

    $scope.session.on('signal:videoUrl', function(event) {
      var videoUrl = event.data;
      console.log('Video Url', videoUrl);
    });

    $scope.session.on('signal:shareFile', function(event) {
      var obj = {};
      var data = JSON.parse(event.data);
      var sentBy = data.sentBy
      if (sentBy !== $scope.user.username) {
        obj.type = 'shareFile';
        obj.sentBy = sentBy;
        obj.fileUrl = data.fileUrl;
        obj.timeSent = data.timeSent;
        Transport.generateHtml(obj, function(html) {
          chatbox.append(html);
        });
      } else {
        obj.type = 'sendReceipt';
        obj.receiptType = 'shareFile';
        Transport.generateHtml(obj, function(html) {
          chatbox.append(html);
        });
      }
    });
    ctrl.createConnection(otSession);
  };

  ctrl.createConnection = function(otSession) {
    $scope.session.connect(otSession.token, function(err) {
      if (err) {
        console.error('error connecting: ', err.code, err.message);
      } else {
        var pubElem = document.createElement('div');
        var publisher = OT.initPublisher(pubElem, {
          resolution: '1280x720'
        }, function(err) {
          if (err) console.error(err);
          $scope.session.publish(publisher);
          layoutContainer.appendChild(pubElem);
          layout();
          localStorageService.set('publisher', publisher);
        });
      }
    });
  };

  ctrl.requestPermission = function() {
    var permissionRequestedBy = $scope.user.username;
    ctrl.broadcast('requestPermission', permissionRequestedBy);
  };

  ctrl.onPermissionResponse = function(event) {
    console.debug('onPermissionResponse');
    if (event.target.id === 'permission-granted') {
      ctrl.broadcast('permissionResponse', 'granted');
      var otSessionId = localStorageService.get('otSession').sessionId;
      ctrl.startRecording(otSessionId);
    } else {
      ctrl.broadcast('permissionResponse', 'denied');
    }
  };

  ctrl.startRecording = function(otSessionId) {
    SessionApi.startRecording(otSessionId).then(function(response) {
      localStorageService.set('archive', response.data);
      var archiveMessage = JSON.stringify(response.data);
      ctrl.emit('archive', archiveMessage);
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.stopRecording = function() {
    var archive = localStorageService.get('archive');
    var archiveId = archive.id;
    SessionApi.stopRecording(archiveId).then(function(response) {
      var archiveResponse = response.data;
      localStorageService.set('archiveResponse', archiveResponse);
      ctrl.getVideoStatus(archiveId);
    });
  };

  ctrl.getVideoStatus = function(archiveId) {
    SessionApi.getVideoStatus(archiveId).then(function(response){
      console.log('response on video status', response);
      }, function(err){
      console.log('err', err);
    })
  };

  ctrl.toggleUpload = function(isClosed) {
    if (isClosed) {
      ngDialog.openConfirm({
        template: '../../views/ngDialog/upload.html',
        controller: 'FooterCtrl'
      });
    } else {
      ngDialog.closeAll();
    }
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
    ctrl.broadcast('shareFile', messageString);
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

  SessionCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'socket', 'ngDialog', 'UserApi', 'SessionApi', 'PubSub', 'Transport', 'localStorageService'];
}
