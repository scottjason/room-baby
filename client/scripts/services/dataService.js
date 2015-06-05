angular.module('RoomBaby')
  .factory('DataService', function() {

    'use strict'

  function generateTable(sessions, callback) {
    var arr = [];
    sessions.forEach(function(elem) {
      var obj = {};
      obj.sessionId = elem.sessionId;
      obj.key = elem.key;
      obj.secret = elem.secret;
      obj.token = elem.token
      obj.name = elem.name;
      obj.createdBy = 'created by ' + elem.createdBy.username + ', ' + (moment(elem.createdAt).calendar()).toLowerCase();
      var lastIndex = elem.users.length - 1;
      elem.users.forEach(function(invitedUser, index) {
        if (index === lastIndex) {
          obj.members = (obj.members || '') + invitedUser.email;
        } else {
          obj.members = (obj.members || '') + invitedUser.email + ', ';
        }
      });
      obj.status = 'ready';
      obj.options = 'connect';
      arr.push(obj);
    });
    callback(arr);
  };

  return ({
    generateTable: generateTable
  });
});