/**
 * Promises Util
 */

'use strict';

var User = require('../../models/user');
var Session = require('../../models/session');

module.exports = {
  getUserSessions: function(userId) {
    return Session.where('users._id').gte(userId).exec()
  },
  clearSessions: function() {
    return Session.remove().exec();
  },
  clearUsers: function() {
    return User.remove().exec();
  },
  deleteSession: function(_id) {
  	return Session.find({ _id: _id }).remove().exec();
  }
};