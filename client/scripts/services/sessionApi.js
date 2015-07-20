angular.module('RoomBaby')
  .factory('SessionApi', function($http) {

    'use strict'

    function createRoom(params) {
      var request = $http({
        method: 'POST',
        url: '/session/create-room',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function deleteRoom(session_id, user_id) {
      console.log('deleteRoom called');
      var request = $http({
        method: 'DELETE',
        url: '/session/' + session_id + '/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/session/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    }

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
    }

    function createBroadcast(user) {
      var request = $http({
        method: 'GET',
        url: '/session/create-broadcast/' + user._id
      });
      return (request.then(successHandler, errorHandler));
    };

    function getBroadcast(broadcast_id) {
      console.log('broadcast_id', broadcast_id);
      var request = $http({
        method: 'GET',
        url: '/session/get-broadcast/' + broadcast_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function startRecording(otSessionId) {
      var request = $http({
        method: 'GET',
        url: '/session/record/' + otSessionId
      });
      return (request.then(successHandler, errorHandler));
    }

    function stopRecording(archiveId) {
      var request = $http({
        method: 'GET',
        url: '/session/stop/' + archiveId
      });
      return (request.then(successHandler, errorHandler));
    }

    function getVideoStatus(archiveId) {
      var request = $http({
        method: 'GET',
        url: '/session/video-status/' + archiveId
      });
      return (request.then(successHandler, errorHandler));
    }

    function generateVideoEmbed(params) {
      var request = $http({
        method: 'POST',
        url: '/session/embed',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function generateBroadcastUrl(broadcastId) {
      return 'https://room-baby-video-api.herokuapp.com/' + broadcastId;
    }

    function successHandler(response) {
      return (response);
    }

    function errorHandler(response) {
      return (response);
    }

    return ({
      createRoom: createRoom,
      deleteRoom: deleteRoom,
      getAll: getAll,
      upload: upload,
      createBroadcast: createBroadcast,
      generateBroadcastUrl: generateBroadcastUrl,
      getBroadcast: getBroadcast,
      startRecording: startRecording,
      stopRecording: stopRecording,
      getVideoStatus: getVideoStatus,
      generateVideoEmbed: generateVideoEmbed
    });
    SessionApi.$inject('$http');
  });
