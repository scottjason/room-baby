var mongoose = require('mongoose');
var moment = require('moment');
var ObjectId = mongoose.Schema.Types.ObjectId;

var sessionSchema = new mongoose.Schema({
  users: [{
    _id: {
      type: ObjectId,
      ref: 'User'
    },
    email: {
      type: String
    },
    username: {
      type: String
    }
  }],
  activeUsers: [],
  name: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  token: {
    type: String,
    required: false
  },
  key: {
    type: String,
    required: false
  },
  secret: {
    type: String,
    required: false
  },
  activeUsers: {
    type: Array
  },
  createdBy: {
    username: {
      type: String,
      required: true
    },
    user_id: {
      type: ObjectId,
      ref: 'User',
      required: true
    }
  },
  createdAt: {
    type: Date
  },
  startsAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
});

sessionSchema.pre('save', function(callback) {
  var now = moment().utc();
  if (!this.createdAt) this.createdAt = now;
  callback();
});

module.exports = mongoose.model('Session', sessionSchema);
