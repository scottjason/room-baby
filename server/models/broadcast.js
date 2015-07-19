var mongoose = require('mongoose');

var broadcastSchema = new mongoose.Schema({
  email: {
    type: String
  },
  username: {
    type: String
  },
  name: {
    type: String
  },
  sessionId: {
    type: String
  },
  token: {
    type: String
  },
  key: {
    type: String
  },
  secret: {
    type: String
  },
  createdAt: {
    type: Number
  },
  startsAt: {
    type: Number
  },
  expiresAt: {
    type: Number
  }
});

broadcastSchema.pre('save', function(callback) {
  var fiveMinutes = 300000;
  this.createdAt = new Date().getTime();
  this.startsAt = new Date().getTime();
  this.expiresAt = this.startsAt + fiveMinutes;
  callback();
});

module.exports = mongoose.model('Broadcast', broadcastSchema);