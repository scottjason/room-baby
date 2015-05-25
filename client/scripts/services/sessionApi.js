angular.module('RoomBaby')
  .factory('SessionApi', function($http) {

    'use strict'

    function create(params) {
      var request = $http({
        method: 'POST',
        url: '/session/create',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    };

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/session/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    };

    function upload(file, user_id, session_id) {
      var formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user_id);
      formData.append('session_id', session_id);
      var request = $http({
        method: 'POST',
        url: '/session/upload',
        data: formData,
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      });
      return (request.then(successHandler, errorHandler));
    };

    function successHandler(response) {
      return (response);
    };

    function errorHandler(response) {
      return (response);
    };

    return ({
      create: create,
      getAll: getAll,
      upload: upload
    });
    SessionApi.$inject('$http');
  });
