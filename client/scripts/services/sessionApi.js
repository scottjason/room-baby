angular.module('RoomBaby')
  .factory('SessionApi', function($http) {

    'use strict'

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/session/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function successHandler(response) {
      return (response);
    }

    function errorHandler(response) {
      return (response);
    }

    return ({
      getAll: getAll
    });
    SessionApi.$inject('$http');
  });
