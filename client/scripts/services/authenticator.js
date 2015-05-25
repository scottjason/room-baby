angular.module('RoomBaby')
  .factory('Authenticator', function($window, localStorageService) {

    'use strict'

    var expirationTime;

    function isAuthenticated() {
      if (!localStorageService.get('isAuthenticated')) {
        return false;
      } else {
        var now = moment().toDate();
        expirationTime = localStorageService.get('expirationTime');
        expirationTime = moment(expirationTime, "YYY-MM-DDTHH:mm:ssZ").toDate();
        if (now < expirationTime) {
          return true;
        } else {
          return false;
        }
      }
    };

    function authenticate(expirationTime) {
      localStorageService.set('isAuthenticated', true);
      localStorageService.set('expirationTime', expirationTime);
    };

    function clearAll() {
      localStorageService.clearAll();
    };

    function reRoute() {
      $window.location.href = $window.location.origin;
    };

    function setLogin(type) {
      if (type === 'facebook') {
        localStorageService.set('facebookLogin', true);
      }
    };

    function getLogin(type) {
      if (type === 'facebook') {
        return localStorageService.get('facebookLogin');
      }
    };

    function removeLogin(type) {
      if (type === 'facebook') {
        localStorageService.set('facebookLogin', null);
      }
    }

    return ({
      isAuthenticated: isAuthenticated,
      authenticate: authenticate,
      clearAll: clearAll,
      reRoute: reRoute,
      setLogin: setLogin,
      getLogin: getLogin,
      removeLogin: removeLogin
    });
    Authenticator.$inject('$window', 'localStorageService')
  });
