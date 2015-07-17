angular.module('RoomBaby')
  .service('TimeService', function($state, $timeout, SessionApi, PubSub, localStorageService) {

    'use strict'

    var oneMinuteInMs = 60000;
    var monthToIndex = {
      'Jan': 0,
      'Feb': 1,
      'Mar': 2,
      'Apr': 3,
      'May': 4,
      'Jun': 5,
      'Jul': 6,
      'Aug': 7,
      'Sep': 8,
      'Oct': 9,
      'Nov': 10,
      'Dec': 11
    };

    function checkExpiration() {
      var sessions = localStorageService.get('sessions');
      var user = localStorageService.get('user');
      var foundExpiredSession = null;
      if (sessions && sessions.length) {
        for (var i = 0; i < sessions.length; i++) {
          var currentMsUtc = new Date().getTime();
          var expiresAtMsUtc = sessions[i].expiresAt;
          var isExpired = (expiresAtMsUtc - currentMsUtc <= 0);
          if (isExpired) {
            foundExpiredSession = true;
            deleteSession(sessions[i]._id, user._id);
            break;
          }
        }
        if (!foundExpiredSession && $state.current.name === 'dashboard') {
          $timeout(checkExpiration, 500);
        }
      } else if ($state.current.name === 'dashboard') {
        $timeout(checkExpiration, 500);
      }
    }

    function deleteSession(sessionId, userId) {
      var sessions;
      SessionApi.deleteRoom(sessionId, userId).then(function(response) {
        console.log('response', response);
        (response.data && response.data.sessions) ? (sessions = response.data.sessions) : (sessions = null);
        localStorageService.set('sessions', sessions);
        if ($state.current.name === 'dashboard') {
          PubSub.trigger('renderTable');
        }
        checkExpiration();
      }, function(err) {
        console.error(err);
      });
    }

    function getReadyStatus(startTimeMsUtc) {
      var currentMsUtc = new Date().getTime();
      var diffInMs = (startTimeMsUtc - currentMsUtc);
      var isReady = (diffInMs <= oneMinuteInMs);
      return isReady;
    }

    function isExpired(expiresAtMsUtc, callback) {
      var currentMsUtc = new Date().getTime();
      var msLeft = (expiresAtMsUtc - currentMsUtc);
      var isExpired = (msLeft <= 0);
      var secondsLeft = (msLeft / 1000);
      var thirtySecondsLeft = (secondsLeft <= 30);
      var twentySecondsLeft = (secondsLeft <= 20);
      callback(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft);
    }

    function sortByStartsAt(arr) {
      return _.sortBy(arr, function(obj) {
        return obj.startsAtMsUtc;
      });
    }

    function formatMonth(month) {
      switch (month) {
        case 'Jan':
          return 'January';
          break;
        case 'Feb':
          return 'February';
          break;
        case 'Mar':
          return 'March'
          break;
        case 'Apr':
          return 'April'
          break;
        case 'May':
          return 'May'
          break;
        case 'Jun':
          return 'June'
          break;
        case 'Jul':
          return 'July'
          break;
        case 'Aug':
          return 'August'
          break;
        case 'Sep':
          return 'September'
          break;
        case 'Oct':
          return 'October'
          break;
        case 'Nov':
          return 'November'
          break;
        case 'Dec':
          return 'December'
          break;
        default:
          console.error('no case found on formatMonth', month);
      }
    }

    function generateDetails(obj, isArchive, callback) {
      if (!isArchive) {
        var startsAt = obj.startsAtFormatted;
        obj.details = 'Starts On ' + startsAt;
        callback(obj);
      } else {
        obj.details = shortUrl;
        callback(obj);
      }
    }

    function getStatus(sessions, callback) {

      var isSessionReady;

      _.each(sessions, function(session) {
        if (session.status !== 'ready') {

          var startsAtMsUtc = session.startsAtMsUtc;
          var isReady = getReadyStatus(startsAtMsUtc);

          if (isReady) {
            session.status = 'ready';
            session.options = 'connect';
            isSessionReady = true;
          }
        }
      });
      callback(isSessionReady, sessions);
    }

    function generateTable(sessions, archives, callback) {

      var arr = [];
      var sortedArr = [];
      var _this = this;

      if (sessions && sessions.length) {
        sessions.forEach(function(session) {
          var obj = {};
          obj._id = session._id;
          obj.sessionId = session.sessionId;
          obj.key = session.key;
          obj.secret = session.secret;
          obj.token = session.token
          obj.name = session.name;
          obj.createdBy = 'created by ' + session.createdBy.username;

          obj.startsAtMsUtc = session.startsAt;
          obj.expiresAtMsUtc = session.expiresAt;

          obj.startsAtLocal = new Date(obj.startsAtMsUtc);
          obj.expiresAtLocal = new Date(obj.expiresAtMsUtc);

          obj.startsAtFormatted = moment(angular.copy(obj.startsAtLocal)).format("ddd, MMMM Do YYYY, h:mm a");
          obj.expiresAtFormatted = moment(angular.copy(obj.expiresAtLocal)).format("ddd, MMMM Do YYYY, h:mm a");

          session.users.forEach(function(invitedUser, index) {
            if (index === (session.users.length - 1)) {
              obj.members = (obj.members || '') + invitedUser.email;
            } else {
              obj.members = (obj.members || '') + invitedUser.email + ', ';
            }
          });

          var isReady = getReadyStatus(obj.startsAtMsUtc);

          if (isReady) {
            obj.status = 'ready';
            obj.options = 'connect';
          } else {
            obj.status = 'scheduled'
            obj.options = 'details';
            generateDetails(obj, null, function(object) {
              obj = object;
            });
          }
          arr.push(obj);
        });
        sortedArr = sortByStartsAt(arr);
      }

      if (archives && archives.length) {
        archives.forEach(function(archive) {
          console.log(archive)
          var obj = {};
          obj.name = archive.name;
          obj.createdBy = archive.createdBy;
          archive.users.forEach(function(invitedUser, index) {
            if (index === (archive.users.length - 1)) {
              obj.members = (obj.members || '') + invitedUser.email;
            } else {
              obj.members = (obj.members || '') + invitedUser.email + ', ';
            }
          });
          obj.status = 'archived';
          obj.options = 'video url';
          obj.details = archive.shortUrl;
          sortedArr.push(obj);
        });
      }
      callback(sortedArr);
    }

    function generateTimeLeft(msLeft) {
      var secondsLeft = (msLeft / 1000);
      var minutesLeft = (secondsLeft / 60);
      secondsLeft = secondsLeft % 60;
      var timeLeft = Math.floor(minutesLeft) + ' minutes and ' + Math.floor(secondsLeft) + ' seconds left';
      return timeLeft;
    }

    function formatUpDate(upDate) {
      var arr = upDate.split('-');
      var year = arr[0];
      var month = arr[1];
      month = formatMonth(month);
      var formattedUpDate = (month + ' ' + year);
      return formattedUpDate;
    }

    function isValid(obj, cb) {
      var currentMsUtc = new Date().getTime();
      if (obj.isStartTime) {
        var startsAtMsUtc = obj.startsAt;
        var isValid = (startsAtMsUtc >= currentMsUtc);
        if (isValid) {
          var obj = {};
          obj.localFormatted = moment(new Date(startsAtMsUtc)).format("dddd, MMMM Do YYYY, h:mm a");
          obj.expiresAtMsUtc = addMinutes(startsAtMsUtc, 5);
          cb(isValid, obj);
        } else {
          cb(isValid, null);
        }
      }
    }

    function setStartDate($dates) {
      angular.forEach($dates, function(date, index) {
        var incomingDate = moment.parseZone(date.utcDateValue).format('D MMM YYYY');
        incomingDate = incomingDate.split(' ');

        var incomingDay = parseInt(incomingDate[0]);
        var incomingMonth = monthToIndex[incomingDate[1]];
        var incomingYear = parseInt(incomingDate[2]);

        var today = new Date();
        var currentDay = today.getDate();
        var currentMonth = today.getMonth();
        var currentYear = today.getFullYear();

        var isToday = ((incomingDay === currentDay) && (incomingMonth === currentMonth) && (incomingYear === currentYear));
        isToday ? (date.active = true) : (date.active = false);
      });
    }

    function addMinutes(incomingMsUtc, minsToAdd) {
      var oneMinute = 60000;
      var msToAdd = (oneMinute * minsToAdd);
      var resultInMs = (incomingMsUtc + msToAdd);
      return resultInMs;
    }

    function generateOpts(startsAtMsUtc) {
      var opts = {};
      opts.isStartTime = true;
      opts.startsAt = startsAtMsUtc;
      return opts;
    }

    return ({
      generateTable: generateTable,
      generateOpts: generateOpts,
      generateTimeLeft: generateTimeLeft,
      getStatus: getStatus,
      formatUpDate: formatUpDate,
      isValid: isValid,
      setStartDate: setStartDate,
      addMinutes: addMinutes,
      isExpired: isExpired,
      checkExpiration: checkExpiration
    });
    TimeService.$inject('$state', '$timeout', 'SessionApi', 'PubSub', 'localStorageService')
  });
