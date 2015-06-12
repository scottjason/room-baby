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
      },
      'overlay': {
        'isOpen': false
      },
      'createRoom': {
        'name': {
          'isValid': false,
          'isPristine': true,
          'text': ''
        },
        'guestEmail': {
          'isValid': false,
          'isPristine': true,
          'text': ''
        },
        'startDate': {
          'isValid': false,
          'text': ''
        },
        'isValid': false
      }
    };

    return ({
      data: stateData,
    });
  });
