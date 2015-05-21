'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', SessionCtrl);

function SessionCtrl($scope, $rootScope, $state, UserApi, PubSub, Transport, localStorageService) {

  var vm = this;
  $rootScope.connectionCount = 0;

  var resizeTimeout;
  window.onresize = function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      layout();
    }, 20);
  };

  var layoutContainer = document.getElementById('layout-container');

  var layout = TB.initLayoutContainer(layoutContainer, {
    animate: {
      duration: 500,
      easing: 'swing'
    },
    bigFixedRatio: false
  }).layout;

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
    var timeSent = moment(new Date()).calendar();
    timeSent = timeSent.split(' ');
    timeSent.splice(0, 2);
    timeSent.join(' ');
    obj.timeSent = timeSent;
    var messageString = JSON.stringify(obj);
    vm.broadcast('message', messageString);
  };


  this.init = function() {
    PubSub.trigger('toggleNavBar', true);
    PubSub.trigger('toggleFooter', true);
    PubSub.on('disconnect', vm.disconnect);
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
      var imageLink = 'http://lorempixel.com/30/30/people/1/'
      Transport.render(sentBy, message, imageLink, timeSent);
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

  vm.disconnect = function() {
    $scope.session.disconnect();
  };

  SessionCtrl.$inject['$scope', '$rootScope', '$state', 'UserApi', 'PubSub', 'Transport', 'localStorageService'];
}
