var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var uuid = require('node-uuid');

var toLower = function toLower(str) {
  return str.toLowerCase();
};

var userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
    set: toLower
  },
  password: {
    type: String
  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String,
  },
  profileImage: {
    type: String,
    default: 'https://raw.githubusercontent.com/scottjason/room-baby/master/client/assets/img/image-default-one.jpg'
  },
  createdAt: {
    type: Number
  },
  updatedAt: {
    type: Number
  },
  utils: {
    resetPassToken: {
      type: String
    },
    resetPassExpires: {
      type: Date
    }
  }
});

userSchema.pre('save', function(callback) {
  if (!this.createdAt) this.createdAt = new Date().getTime();
  this.updatedAt = new Date().getTime();

  if (this.password) {
    var _this = this;
    if (!_this.isModified('password')) return callback();
    bcrypt.genSalt(5, function(err, salt) {
      if (err) return callback(err);
      bcrypt.hash(_this.password, salt, null, function(err, hash) {
        if (err) return callback(err);
        _this.password = hash;
        return callback();
      });
    });
  } else {
    callback();
  }
});

userSchema.methods.verifyPassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

userSchema.methods.generateTempPass = function() {
  return uuid.v4().substring(0, 6);
};

module.exports = mongoose.model('User', userSchema);
