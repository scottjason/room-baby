angular.module('RoomBaby')
  .factory('stateService', function() {

    'use strict'

    var stateData = {
      'animation': {
        'runLanding': true
      },
      'landing': {
        'members': {
          'isOpen': false
        }
      }
    };

    return ({
      data: stateData,
    });
  });
