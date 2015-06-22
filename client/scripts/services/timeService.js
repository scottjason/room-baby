angular.module('RoomBaby')
  .service('timeService', function(socket) {

    'use strict'

    var oneMinute = 60000;

    function getReadyStatus(startTimeMsUtc) {
      var currentMsUtc = new Date().getTime();
      var diff = (startTimeMsUtc - currentMsUtc);
      var isReady = (diff <= oneMinute);
      return isReady;
    }

    function isExpired(expiresAtMsUtc) {
      var currentMsUtc = new Date().getTime();
      var diff = (expiresAtMsUtc - currentMsUtc);
      var isExpired = (diff <= oneMinute);
      return isExpired;
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
      sessions.forEach(function(session) {
        var obj = {};
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
        console.log(this);
        var isReady = getReadyStatus(obj.startsAtMsUtc);

        if (isReady) {
          obj.status = 'ready';
          obj.options = 'connect';
        } else {
          obj.status = 'scheduled'
          obj.options = 'details';
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
      /* onload, set current date to active */
      angular.forEach($dates, function(date, index) {

        var incomingUtcValue = date.localDateValue();
        var currentUtcValue = new Date().getTime();

        var incomingDate = moment(incomingUtcValue).format('YYYY/MM/DD');
        var currentDate = moment(currentUtcValue).format('YYYY/MM/DD');

        var incomingDay = parseInt(moment(angular.copy(incomingDate)).format('D'));
        var incomingMonth = parseInt(moment(angular.copy(incomingDate)).format('M'));
        var incomingYear = parseInt(moment(angular.copy(incomingDate)).format('YYYY'));

        var currentDay = parseInt(moment(angular.copy(currentDate)).format('D'));
        var currentMonth = parseInt(moment(angular.copy(currentDate)).format('M'));
        var currentYear = parseInt(moment(angular.copy(currentDate)).format('YYYY'));

        var isToday = ((currentDay === incomingDay) && (currentMonth === incomingMonth) && (currentYear === incomingYear));
        if (isToday) {
          date.active = true;
        } else {
          date.active = false;
        }
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
      addMinutes: addMinutes
    });
    timeService.$inject('socket');
  });
