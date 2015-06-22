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
          'localUtc': {},
          'localFormatted': {}
        },
        'form': {
          'isValid': false
        },
        'isOnload': true
      },
      'Session': {
        'table': []
      },
      'Dashboard': {
        'options': {
          'connect': false
        }
      }
    };

    return ({
      data: stateData,
    });
  });
