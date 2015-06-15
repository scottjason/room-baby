angular.module('RoomBaby')
  .service('dataService', function(socket) {

    'use strict'

    var module = {
      isReady: function(startTime) {
        var currentTime = moment();
        var duration = moment.duration(startTime.diff(currentTime));
        var minutesLeft = duration.asMinutes();
        if (minutesLeft <= 3) return true;
        return false;
      },
      isExpired: function(expiresAt) {
        var currentTime = moment();
        var duration = moment.duration(startTime.diff(currentTime));
        var minutesLeft = duration.asMinutes();
        if (minutesLeft <= -5) return true;
        return false;
      },
      sortByExpiration: function(arr) {
        return _.sortBy(arr, function(obj) { return obj.expiresAtValue; });
      }
    };

    function getStatus(sessions, callback) {

      var isSessionReady;

      _.each(sessions, function(session) {

        if (session.status !== 'ready') {

          var startsAt = angular.copy(session.startsAt);
          var isReady = module.isReady(startsAt);

          if (isReady) {
            session.status = 'ready';
            session.options = 'connect';
            isSessionReady = true;
          }
        }
      });
      callback(isSessionReady, sessions);
    }

    function generateTable(sessions, callback) {

      var arr = [];
      sessions.forEach(function(session) {
        var obj = {};
        obj.sessionId = session.sessionId;
        obj.key = session.key;
        obj.secret = session.secret;
        obj.token = session.token
        obj.name = session.name;
        obj.createdBy = 'created by ' + session.createdBy.username;

        var startsAt = angular.copy(session.startsAt);
        var expiresAt = angular.copy(session.expiresAt);

        obj.startsAt = moment(startsAt);
        obj.expiresAt = moment(expiresAt);

        var startsAt = angular.copy(session.startsAt);
        var expiresAt = angular.copy(session.expiresAt);

        obj.startsAtFormatted = moment(startsAt).format("ddd, MMMM Do YYYY, h:mm:ss a");
        obj.expiresAtFormatted = moment(expiresAt).format("ddd, MMMM Do YYYY, h:mm:ss a");

        var expiresAt = angular.copy(session.expiresAt);
        obj.expiresAtValue = moment(expiresAt).valueOf();

        var lastIndex = session.users.length - 1;
        session.users.forEach(function(invitedUser, index) {
          if (index === lastIndex) {
            obj.members = (obj.members || '') + invitedUser.email;
          } else {
            obj.members = (obj.members || '') + invitedUser.email + ', ';
          }
        });

        var startsAt = angular.copy(session.startsAt);
        var isReady = module.isReady(moment(startsAt));

        if (isReady) {
          obj.status = 'ready';
          obj.options = 'connect';
        } else {
          obj.status = 'scheduled'
          obj.options = 'details';
        }
        arr.push(obj);
      });
      var sortedArr = module.sortByExpiration(arr);
      callback(sortedArr);
    }

    return ({
      generateTable: generateTable,
      getStatus: getStatus
    });
    dataService.$inject('socket');
  });
