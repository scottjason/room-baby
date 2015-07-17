angular.module('RoomBaby')
  .factory('ArchiveService', function($http, localStorageService) {

    'use strict'

    function generateOpts(callback) {

      var opts = {};

      opts.name = localStorageService.get('otSession').name;
      opts.sessionId = localStorageService.get('otSession')._id;
      opts.createdBy = localStorageService.get('otSession').createdBy;
      opts.sessionStart = localStorageService.get('otSession').startsAtMsUtc;
      opts.longUrl = localStorageService.get('videoUrl');

      var sessions = localStorageService.get('sessions');

      var targetId = opts.sessionId;

      _.find(sessions, function(sesssion) {
        var isMatch = (sesssion._id === targetId);
        if (isMatch) {
          return opts.users = sesssion.users
        }
      });
      callback(opts);
    }

    function createArchive(params) {
      var request = $http({
        method: 'POST',
        url: '/archive/',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/archive/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    };

    function successHandler(response) {
      return (response);
    }

    function errorHandler(response) {
      return (response);
    }

    return ({
      generateOpts: generateOpts,
      createArchive: createArchive,
      getAll: getAll
    });
    ArchiveService.$inject('$http', 'localStorageService');
  });
