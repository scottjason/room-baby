angular.module('RoomBaby')
  .factory('stateService', function() {

    'use strict'

    var stateData = {
      'animation': {
        'runLanding': true
      }
    };

    return ({
      data: stateData,
    });
  });
