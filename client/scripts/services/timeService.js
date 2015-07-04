angular.module('RoomBaby')
  .service('timeService', function() {

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
      callback(isExpired, msLeft);
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

    function generateDetails(obj, callback) {
      var startsAt = obj.startsAtFormatted;
      obj.details = 'Starts On ' + startsAt;
      callback(obj);
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

    function generateTable(sessions, callback) {

      var arr = [];
      var _this = this;

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

        var lastIndex = session.users.length - 1;
        session.users.forEach(function(invitedUser, index) {
          if (index === lastIndex) {
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
          generateDetails(obj, function(object) {
            obj = object;
          });
        }
        arr.push(obj);
      });
      var sortedArr = sortByStartsAt(arr);
      callback(sortedArr);
    }

    function formatUpDate(upDate) {
      var arr = upDate.split('-');
      var year = arr[0];
      var month = arr[1];
      month = formatMonth(month);
      var formattedUpDate = (month + ' ' + year);
      return formattedUpDate;
    }

    function validate(obj, cb) {
      var currentMsUtc = new Date().getTime();
      if (obj.isStartTime) {
        var startsAtMsUtc = obj.startsAt;
        var isValid = (startsAtMsUtc >= currentMsUtc);
        if (isValid) {
          var obj = {};
          obj.localFormatted = moment(new Date(startsAtMsUtc)).format("dddd, MMMM Do YYYY, h:mm a");
          obj.expiresAtMsUtc = addMinutes(startsAtMsUtc, 10);
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


    return ({
      generateTable: generateTable,
      getStatus: getStatus,
      formatUpDate: formatUpDate,
      validate: validate,
      setStartDate: setStartDate,
      addMinutes: addMinutes,
      isExpired: isExpired
    });
  });
