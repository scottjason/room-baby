'use strict';

angular.module('RoomBaby')
  .controller('BroadCastCtrl', BroadCastCtrl);

function BroadCastCtrl($scope, $rootScope, $state, $timeout, $window, PubSub, ConstantService, SessionApi, Animator, StateService, localStorageService) {

  var ctrl = this;

  var layoutContainer = document.getElementById('broadcast-container');
  var layoutOpts = ConstantService.generateOpts('layout');

  var layout = TB.initLayoutContainer(layoutContainer, layoutOpts).layout;

  $window.onresize = function() {
    var resizeCams = function() {
      layout();
    }
    $timeout(resizeCams, 20);
  };

  $scope.registerEvents = function(session) {
    session.on('streamCreated', function(event) {
      var subscriberProperties = {
        insertMode: 'append',
        width: '1024',
        height: '768'
      };
      var subscriber = session.subscribe(event.stream,
        'layoutContainer',
        subscriberProperties,
        function(error) {
          if (error) {
            console.log(error);
          } else {
            console.log('Subscriber added.');
          }
        });
    });
  }


  this.init = function() {
    if (localStorageService.get('user')) {
      var broadcast = localStorageService.get('broadcast');
      console.log('broadcast', broadcast);
      $scope.session = OT.initSession(broadcast.key, broadcast.sessionId);
      $scope.session.connect(broadcast.token, function(err) {
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
    } else {
      SessionApi.getBroadcast($state.params.broadcast_id).then(function(response) {
        console.log(response);
        var broadcast = response.data;
        $scope.session = OT.initSession(broadcast.key, broadcast.sessionId);
        $scope.registerEvents($scope.session);
        $scope.session.connect(broadcast.token, function(err) {});
      });

    }
  };

  BroadCastCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'PubSub', 'ConstantService', 'SessionApi', 'Animator', 'StateService', 'localStorageService'];
}
