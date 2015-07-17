var Bitly = require('bitly');
var config = require('../config');

var bitly = new Bitly(config.bitly.username, config.bitly.key);

var mongoose = require('mongoose');

var archiveSchema = new mongoose.Schema({
  name: {
    type: String
  },
  createdBy: {
    type: String
  },
  shortUrl: {
    type: String,
  },
  longUrl: {
    type: String,
  },
  sessionId: {
    type: String
  },
  sessionStart: {
    type: Number
  },
  users: {
    type: Array
  },
  createdAt: {
    type: Number
  }
});

archiveSchema.pre('save', function(cb) {
  this.createdAt ? this.createdAt : new Date().getTime();
  cb();
});

archiveSchema.methods.generateShortUrl = function(longUrl, callback) {
  bitly.shorten(longUrl, function(err, res) {
    if (err) return callback(err);
    callback(null, res.data.url);
  });
};

module.exports = mongoose.model('Archive', archiveSchema);
