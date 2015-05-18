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
  },
  activeUsersApiKey: {
    type: String
  }
});

sessionSchema.pre('save', function(callback) {
  var now = moment().utc();
  if (!this.createdAt) this.createdAt = now;
  callback();
});

sessionSchema.methods.generateUserObj = function(user, callback) {
  var obj = {};
  obj._id = user._id;
  obj.email = user.email;
  obj.username = user.username || null;
  callback(null, obj)
};

module.exports = mongoose.model('Session', sessionSchema);
