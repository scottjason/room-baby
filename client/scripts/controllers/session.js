'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', SessionCtrl);

function SessionCtrl($scope, $rootScope, $state, $window, $timeout, FacebookService, StateService, ConstantService, TimeService, ngDialog, UserApi, SessionApi, PubSub, Transport, localStorageService) {

  var ctrl = this;
  var now = moment(new Date()).calendar();

  $rootScope.connectionCount = 0;

  var chatbox = angular.element(document.getElementById('chatbox'));
  var layoutContainer = document.getElementById('layout-container');
  var layoutOpts = ConstantService.generateOpts('layout');

  var layout = TB.initLayoutContainer(layoutContainer, layoutOpts).layout;

  $window.onresize = function() {
    var resizeCams = function() {
      layout();
    }
    $timeout(resizeCams, 20);
  };

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {
        ctrl.initialize();
      } else if (response.status === 401) {
        localStorageService.clearAll();
        $state.go('landing');
      } else {
        localStorageService.clearAll();
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }
    }, function(err) {
      localStorageService.clearAll();
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  this.sendMessage = function() {
    if ($rootScope.connectionCount < 2) {
      $scope.user.message = '';
      PubSub.trigger('featureDisabled');
    } else {
      Transport.generateMessage($scope.user, function(chatMessage) {
        $scope.user.message = '';
        ctrl.broadcast('chatMessage', chatMessage);
      });
    }
  };

  ctrl.initialize = function() {
    $rootScope.isDissconected = false;
    $scope.user = localStorageService.get('user');
    $scope.otSession = localStorageService.get('otSession');

    StateService.data['Auth'].isFacebook = ($scope.user.facebook && $scope.user.facebook.token) ? true : false;

    PubSub.on('shareFile', ctrl.shareFile);
    PubSub.on('requestPermission', ctrl.requestPermission);
    PubSub.on('stopRecording', ctrl.stopRecording);
    PubSub.on('disconnect', ctrl.disconnect);
    PubSub.on('toggleUpload', ctrl.toggleUpload);
    PubSub.on('enterBtn:onChatMessage', this.sendMessage);
    PubSub.trigger('toggleNavBar', true);
    PubSub.trigger('setUser', $scope.user);

    ctrl.isExpired($scope.otSession.expiresAtMsUtc);
    ctrl.createSession($scope.otSession);
  };

  ctrl.isExpired = function(expiresAtMsUtc) {

    $scope.expiresAtMsUtc = $scope.expiresAtMsUtc ? $scope.expiresAtMsUtc : expiresAtMsUtc;

    function getStatus() {
      TimeService.isExpired($scope.expiresAtMsUtc, function(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft) {
        isExpired ? ctrl.disconnect() : ctrl.renderCountDown(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft);
      });
    }
    getStatus();
  };

  ctrl.renderCountDown = function(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft) {
    if (!isExpired) {
      var timeLeft = TimeService.generateTimeLeft(msLeft);
      PubSub.trigger('timeLeft', timeLeft, thirtySecondsLeft, twentySecondsLeft);
      $timeout(ctrl.isExpired, 1000);
    }
  }

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
      console.debug('connectionCreated');
      $rootScope.connectionCount++
        if (event.connection.creationTime < $scope.session.connection.creationTime) {
          localStorageService.set('connectionObj', event.connection);
          $scope.connectionObj = event.connection;
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
      };
      ctrl.routeToDashboard(opts);
    });

    $scope.session.on('connectionDestroyed', function(event) {
      console.debug('connection destroyed.');
      var sessions;
      $rootScope.connectionCount--;
      var userId = localStorageService.get('user')._id;
      SessionApi.getAll(userId).then(function(response) {
        var sessions = (response.data && response.data.sessions) ? response.data.sessions : null;
        localStorageService.set('sessions', sessions);
        $scope.session.disconnect();
      });
    });

    $scope.session.on('signal:onConnected', function(event) {
      var opts = Transport.generateOpts('onConnected', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
      });
    });

    $scope.session.on('signal:chatMessage', function(event) {
      var opts = Transport.generateOpts('chatMessage', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
      });
    });

    $scope.session.on('signal:requestPermission', function(event) {
      var isSelf = (event.data === $scope.user.username)
      if (!isSelf) {
        var opts = Transport.generateOpts('requestPermission', event.data);
        Transport.generateHtml(opts, function(html) {
          chatbox.append(html);
          Transport.scroll('down');
          $timeout(bindListeners, 100);

          function bindListeners() {
            document.getElementById('permission-granted').addEventListener('click', ctrl.onPermissionResponse, false);
            document.getElementById('permission-denied').addEventListener('click', ctrl.onPermissionResponse, false);
          };
        });
      }
    });

    $scope.session.on('signal:permissionResponse', function(event) {
      var opts = Transport.generateOpts('sendReceipt', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
      });
    });

    $scope.session.on('signal:startRecording', function() {
      PubSub.trigger('isRecording', true);
    });

    $scope.session.on('signal:stopRecording', function() {
      PubSub.trigger('isRecording', false);
      PubSub.trigger('generatingVideo', true);
    });

    $scope.session.on('signal:archive', function(event) {
      var archive = JSON.parse(event.data);
      localStorageService.set('archive', archive);
    });

    $scope.session.on('signal:shareVideo', function(event) {
      PubSub.trigger('generatingVideo', false);
      var opts = Transport.generateOpts('shareVideo', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
        var isFacebookLogin = StateService.data['Auth'].isFacebook;
        if (isFacebookLogin) {
          ctrl.openShareDialog();
        } else {
          console.log('user not logged in through facebook');
        }
      });
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
          Transport.scroll('down');
        });
      } else {
        obj.type = 'sendReceipt';
        obj.receiptType = 'shareFile';
        Transport.generateHtml(obj, function(html) {
          chatbox.append(html);
          Transport.scroll('down');
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
          ctrl.pubCallback();
        });
      }
    });
  };

  ctrl.pubCallback = function() {
    PubSub.trigger('toggleFooter', true);
  };

  ctrl.requestPermission = function() {
    var permissionRequestedBy = $scope.user.username;
    ctrl.broadcast('requestPermission', permissionRequestedBy);
  };

  ctrl.onPermissionResponse = function(event) {
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
      ctrl.broadcast('startRecording', '');
      localStorageService.set('archive', response.data);
      var archiveMessage = JSON.stringify(response.data);
      ctrl.emit('archive', archiveMessage);
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.stopRecording = function() {
    ctrl.broadcast('stopRecording', '');
    var archive = localStorageService.get('archive');
    var archiveId = archive.id;
    SessionApi.stopRecording(archiveId).then(function(response) {
      localStorageService.set('archiveResponse', response.data);
      ctrl.getVideoStatus(archiveId);
    });
  };

  ctrl.getVideoStatus = function(archiveId) {
    $scope.archiveId = archiveId ? archiveId : $scope.archiveId
    SessionApi.getVideoStatus($scope.archiveId).then(function(response) {
      console.log('response.data', response.data);
      var isReady = response.data.isReady;
      if (isReady) {
        var videoUrl = response.data.video.url;
        ctrl.broadcast('shareVideo', videoUrl);
      } else {
        $timeout(ctrl.getVideoStatus, 300);
      }
    }, function(err) {
      console.error(err);
    });
  };

  ctrl.openShareDialog = function() {
    var partnerId = localStorageService.get('archive').partnerId;
    var archiveId = localStorageService.get('archive').id;
    var url = FacebookService.generateUrl(partnerId, archiveId);
    FacebookService.openShareDialog(url);
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
    $rootScope.isDissconected = true;
    var sessionId = localStorageService.get('otSession')._id;
    var userId = localStorageService.get('user')._id;
    ctrl.deleteRoom(sessionId, userId);
  };

  ctrl.deleteRoom = function(session_id, user_id) {
    var sessions;
    SessionApi.deleteRoom(session_id, user_id).then(function(response) {
      (response.data && response.data.sessions) ? (sessions = response.data.sessions) : (sessions = null);
      localStorageService.set('sessions', sessions);
      $scope.session.disconnect();
    }, function(err) {
      console.error(err);
    });
  }

  ctrl.routeToDashboard = function(opts) {
    PubSub.trigger('toggleFooter', false);
    $state.go('dashboard', opts);
  }

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
    console.log('type', type);
    $scope.session.signal({
      type: type,
      data: message,
    }, function(err) {
      if (err) console.error('signal error ( ' + err.code + ' ) : ' + err.reason);
    });
  };

  SessionCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'FacebookService', 'StateService', 'ConstantService', 'TimeService', 'ngDialog', 'UserApi', 'SessionApi', 'PubSub', 'Transport', 'localStorageService'];
}
