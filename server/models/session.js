var mongoose = require('mongoose');
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
  activeUsers: {
    type: Array
  },
  createdBy: {
    username: {
      type: String
    },
    user_id: {
      type: ObjectId,
      ref: 'User',
    }
  },
  createdAt: {
    type: Date
  },
  startsAt: {
    type: Number
  },
  expiresAt: {
    type: Number
  }
});

sessionSchema.pre('save', function(callback) {
  this.createdAt = this.createdAt ? this.createdAt : new Date();
  callback();
});

sessionSchema.methods.addMinutes = function(startingMs, minsToAdd) {
  var msPerMin = 60000;
  var msToAdd = (minsToAdd  * msPerMin);
  return startingMs + msToAdd
};

module.exports = mongoose.model('Session', sessionSchema);
