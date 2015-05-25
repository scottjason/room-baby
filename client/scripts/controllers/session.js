'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', SessionCtrl);

function SessionCtrl($scope, $rootScope, $state, $window, $timeout, UserApi, PubSub, Transport, localStorageService) {

  var vm = this;
  var timeSent = moment(new Date()).calendar();
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
    var timeSent = angular.copy(timeSent);
    timeSent = timeSent.split(' ');
    timeSent.splice(0, 2);
    timeSent = timeSent.join(' ');
    obj.timeSent = timeSent;
    var messageString = JSON.stringify(obj);
    vm.broadcast('message', messageString);
  };


  this.init = function() {
    PubSub.on('disconnect', vm.disconnect);
    PubSub.on('fileShare', vm.shareFile);
    PubSub.trigger('toggleNavBar', true);
    PubSub.trigger('toggleFooter', true);
    $scope.user = localStorageService.get('user');
    $scope.otSession = localStorageService.get('otSession');
    vm.createSession($scope.otSession);
  };

  vm.createSession = function(otSession) {
    if (OT.checkSystemRequirements() === 0) {
      console.error('The client does not support WebRTC.');
    } else {
      $scope.session = OT.initSession(otSession.key, otSession.sessionId);
      vm.registerEvents(otSession);
    }
  };

  vm.registerEvents = function(otSession) {
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
        vm.emit('connected', $scope.user.username);
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
      vm.routeToDashboard(opts);
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
      var data = JSON.parse(event.data);
      var sentBy = data.sentBy;
      var message = data.message;
      var timeSent = data.timeSent;
      Transport.render(sentBy, message, imageLink, timeSent);
    });

    $scope.session.on('signal:file', function(event) {
      var data = JSON.parse(event.data);
      var sentBy = data.sentBy;
      var fileUrl = data.fileUrl;
      var timeSent = data.timeSent;
      Transport.sendFile(sentBy, fileUrl, timeSent);
    });

    vm.createConnection(otSession);
  };

  vm.createConnection = function(otSession) {
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

  vm.disconnect = function() {
    $scope.session.disconnect();
  };

  vm.shareFile = function(fileUrl) {
    var obj = {};
    obj.sentBy = $scope.user.username;
    obj.fileUrl = fileUrl;
    var timeSent = angular.copy(timeSent);
    timeSent = timeSent.split(' ');
    timeSent.splice(0, 2);
    timeSent = timeSent.join(' ');
    obj.timeSent = timeSent;
    var messageString = JSON.stringify(obj);
    vm.broadcast('file', messageString);
  };

  vm.routeToDashboard = function(opts) {
    $state.go('dashboard', opts);
  };

  vm.emit = function(type, message) {
    $scope.session.signal({
      to: $scope.connectionObj,
      type: type,
      data: message,
    }, function(err) {
      if (err) console.error('signal error ( ' + err.code + ' ) : ' + err.reason);
    });
  };

  vm.broadcast = function(type, message) {
    $scope.session.signal({
      type: type,
      data: message,
    }, function(err) {
      if (err) console.error('signal error ( ' + err.code + ' ) : ' + err.reason);
    });
  };


  SessionCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'UserApi', 'PubSub', 'Transport', 'localStorageService'];
}
