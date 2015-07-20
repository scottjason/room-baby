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
  this.createdAt = new Date().getTime();
  this.startsAt = new Date().getTime();
  this.expiresAt = this.startsAt + fiveMinutes;
  callback();
});

broadcastSchema.methods.generateUrls = function(referer, broadcastId, cb) {
  referer = referer.split('/');
  var protocol = referer[0];
  var slashes = '//';
  var longUrl = protocol + slashes + referer[2] + '/broadcast/' + broadcastId;
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
