angular.module('RoomBaby')
  .factory('StateService', function() {

    'use strict'

    var stateData = {
      'Animator': {
        'landing': {
          'hasAnimated': false
        },
        'login': {
          'hasAnimated': false
        },
        'register': {
          'hasAnimated': false
        }
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
        'formData': {
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
      },
      'Auth': {
        'isFacebook': false
      },
      'Facebook': {
        'shareDialog': {
          'isOpen': false
        }
      },
      'Controllers': {
        'Footer': {
          'isReady': false
        },
        'Landing': {
          'isReady': false
        },
        'Dashboard': {
          'isReady': false
        },
        'Session': {
          'isReady': false
        },
        'Navbar': {
          'isReady': false
        }
      }
    };

    return ({
      data: stateData,
    });
  });
