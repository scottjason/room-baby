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
        return 'please enter a valid username, minimum three characters';
      } else if (type === 'invalidEmail') {
        return 'please enter a valid email';
      } else if (type === 'invalidPassword') {
        return 'please enter a valid password, minimum six characters';
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
