/**
 * Upload Util
 */

'use strict';

var Bitly = require('bitly');
var config = require('../');
var uuid = require('node-uuid');

var bitly = new Bitly(config.bitly.username, config.bitly.key);

module.exports = {
  obj: {},
  setId: function() {
    this.obj.uuid = uuid.v1();
  },
  getId: function() {
    return this.obj.uuid;
  },
  generateKey: function(req) {
    return 'user-id/' + req.session.user._id + '/' + this.getId() + '.' + req.files.file.extension;
  },
  generateUrl: function(req, callback) {
    if (!req.isProfileImg) {
      this.generateShortUrl(config.aws.base + 'user-id/' + req.session.user._id + '/' + this.getId() + '.' + req.files.file.extension, callback);
    } else {
      callback(config.aws.base + 'user-id/' + req.session.user._id + '/' + this.getId() + '.' + req.files.file.extension);
    }
  },
  generateShortUrl: function(longUrl, callback) {
    bitly.shorten(longUrl, function(err, res) {
      if (err) return callback(err);
      return callback(null, res.data.url);
    });
  }
}
