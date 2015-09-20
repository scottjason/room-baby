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
        return 'you cannot schedule a room for a date in the past';
      } else if (type === 'invalidUserName') {
        return 'invalid username';
      } else if (type === 'invalidEmail') {
        return 'invalid email';
      } else if (type === 'invalidPassword') {
        return 'invalid password';
      } else if (type === 'invalidTitle') {
        return 'please enter a valid room title, between three and twenty six characters';
      } else if (type === 'dateReset') {
        return 'please select a start date and start time for this room';
      }
    }

    return ({
      generateOpts: generateOpts,
      generateError: generateError
    });
  });
