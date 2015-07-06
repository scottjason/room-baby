angular.module('RoomBaby')
  .factory('ArchiveService', function($http, localStorageService) {

    'use strict'

    function generateOpts(callback) {

      var opts = {};

      opts.name = localStorageService.get('otSession').name;
      opts.sessionId = localStorageService.get('otSession')._id;
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

    function generateTable() {

    }

    function createArchive(params) {
      var request = $http({
        method: 'POST',
        url: '/archive/',
        data: params
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
      generateOpts: generateOpts,
      generateTable: generateTable,
      createArchive: createArchive
    });
    ArchiveService.$inject('$http', 'localStorageService');
  });
