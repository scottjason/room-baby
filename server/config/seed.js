/**
 * Database Seed Configuration
 */

'use strict';

var User = require('../models/user');
var Session = require('../models/session');
var OpenTok = require('opentok');
var async = require('async');
var moment = require('moment');
var promise = require('./utils/promise');
var config = require('./');

require('colors');

var opentok = new OpenTok(config.openTok.key, config.openTok.secret);

var clearDb = function clearDb() {
  async.parallel({
      clearUsers: function(callback) {
        promise.clearUsers().then(function(err, status) {
          if (status.ok) callback(null);
        })
      },
      clearSessions: function(callback) {
        promise.clearSessions().then(function(err, status) {
          if (status.ok) callback(null);
        })
      }
    },
    function(err) {
      if (err) return console.log(err);
      createUsers()
    });
};

var createUsers = function createUsers() {
  async.parallel({
      userOne: function(callback) {
        var userOne = new User();
        userOne.username = config.seed.userOne.username;
        userOne.email = config.seed.userOne.email;
        userOne.password = config.seed.userOne.password;
        userOne.save(function(err, savedUser) {
          if (err) return callback(err);
          callback(null, savedUser);
        })
      },
      userTwo: function(callback) {
        var userTwo = new User();
        userTwo.username = config.seed.userTwo.username;
        userTwo.email = config.seed.userTwo.email;
        userTwo.password = config.seed.userTwo.password;
        userTwo.save(function(err, savedUser) {
          if (err) return callback(err);
          callback(null, savedUser);
        })
      },
      userThree: function(callback) {
        var userTwo = new User();
        userTwo.email = config.seed.userThree.email;
        userTwo.save(function(err, savedUser) {
          if (err) return callback(err);
          callback(null, savedUser);
        })
      },
      userFour: function(callback) {
        var userTwo = new User();
        userTwo.email = config.seed.userFour.email;
        userTwo.save(function(err, savedUser) {
          if (err) return callback(err);
          callback(null, savedUser);
        })
      }
    },
    function(err, users) {
      var sessionOneUsers = [];
      var sessionTwoUsers = [];
      var sessionThreeUsers = [];
      sessionOneUsers.push(users.userOne, users.userTwo);
      sessionTwoUsers.push(users.userOne, users.userThree);
      sessionThreeUsers.push(users.userOne, users.userFour);
      createSessionOne(sessionOneUsers);
      createSessionTwo(sessionTwoUsers);
      createSessionThree(sessionThreeUsers);
    });
};

var createSessionOne = function createSession(arr, arrTwo) {
  opentok.createSession({
    mediaMode: 'routed'
  }, function(err, otSession) {
    if (err) return console.log(err);
    var session = new Session();
    arr.forEach(function(user) {
      var obj = {};
      obj._id = user._id;
      obj.username = user.username;
      obj.email = user.email;
      session.users.push(obj);
    });
    session.name = 'Monday Meeting';
    session.startsAt = moment().add(3, 'minutes');
    session.expiresAt = moment().add(8, 'minutes');
    session.sessionId = otSession.sessionId;
    session.token = opentok.generateToken(session.sessionId);
    session.createdBy.user_id = session.users[0]._id;
    session.createdBy.username = session.users[0].username;
    session.save(function(err, savedSession) {
      if (err) return console.log(err);
    });
  });
};

var createSessionTwo = function createSessionTwo(arr) {
  opentok.createSession({
    mediaMode: 'routed'
  }, function(err, otSession) {
    if (err) return console.log(err);
    var session = new Session();
    arr.forEach(function(user) {
      var obj = {};
      if (user._id) obj._id = user._id;
      if (user.username) obj.username = user.username;
      if (user.email) obj.email = user.email;
      session.users.push(obj);
    });
    session.name = 'Document Overview';
    session.startsAt = moment().add(6, 'minutes');
    session.expiresAt = moment().add(11, 'minutes');
    session.sessionId = otSession.sessionId;
    session.token = opentok.generateToken(session.sessionId);
    if (session.users[0]._id) session.createdBy.user_id = session.users[0]._id;
    if (session.users[1]._id) session.createdBy.user_id = session.users[1]._id;
    if (session.users[0].username) session.createdBy.username = session.users[0].username;
    if (session.users[1].username) session.createdBy.username = session.users[1].username;
    session.save(function(err, savedSession) {
      if (err) return console.log(err);
    });
  });
}

var createSessionThree = function createSessionThree(arr) {
  opentok.createSession({
    mediaMode: 'routed'
  }, function(err, otSession) {
    if (err) return console.log(err);
    var session = new Session();
    arr.forEach(function(user) {
      var obj = {};
      if (user._id) obj._id = user._id;
      if (user.username) obj.username = user.username;
      if (user.email) obj.email = user.email;
      session.users.push(obj);
    });
    session.name = "Mom's Birthday";
    session.startsAt = moment().add(10, 'minutes');
    session.expiresAt = moment().add(15, 'minutes');
    session.sessionId = otSession.sessionId;
    session.token = opentok.generateToken(session.sessionId);
    if (session.users[0]._id) session.createdBy.user_id = session.users[0]._id;
    if (session.users[1]._id) session.createdBy.user_id = session.users[1]._id;
    if (session.users[0].username) session.createdBy.username = session.users[0].username;
    if (session.users[1].username) session.createdBy.username = session.users[1].username;
    session.save(function(err, savedSession) {
      if (err) return console.log(err);
    });
  });
}
exports.init = function() {
  clearDb();
};
