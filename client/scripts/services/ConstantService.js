angular.module('RoomBaby')
  .factory('ConstantService', function() {

    'use strict'

    function generateOpts(type) {
      if (type === 'layout') {
        var opts = {
          Animator: {
            duration: 500,
            easing: 'swing'
          },
          bigFixedRatio: false
        };
      }
      return opts;
    }

    function generateError(type) {
      if (type === 'invalidDate') {
        'you cannot schedule a room for a date in the past';
      }
    }

    return ({
      generateOpts: generateOpts,
      generateError: generateError
    });
  });
