var mongoose = require('mongoose');
var config = require('../config');
var Bitly = require('bitly');

var bitly = new Bitly(config.bitly.username, config.bitly.key);

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
  connectCount: {
    type: Number,
    default: 0
  },
  shortUrl: {
    type: String
  },
  longUrl: {
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
  this.createdAt = this.createdAt ? this.createdAt : new Date().getTime();
  this.startsAt = this.startsAt ? this.startsAt : new Date().getTime();
  this.expiresAt = this.expiresAt ? this.expiresAt : (this.startsAt + fiveMinutes);
  callback();
});


broadcastSchema.methods.generateUrls = function(referer, broadcastId, cb) {
  var longUrl = 'https://room-baby-api.herokuapp.com/' + broadcastId;
  this.generateShortUrl(longUrl, cb);
};

broadcastSchema.methods.generateShortUrl = function(longUrl, cb) {
  bitly.shorten(longUrl, function(err, res) {
    if (err) return callback(err);
    var shortUrl = res.data.url;
    cb(null, longUrl, shortUrl);
  });
};

module.exports = mongoose.model('Broadcast', broadcastSchema);
