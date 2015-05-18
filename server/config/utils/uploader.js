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
    if(this.obj.uuid) delete this.obj.uuid;
    this.obj.uuid = uuid.v1();
  },
  getId: function() {
    return this.obj.uuid;
  },
  generateKey: function(req) {
    console.log(req);
    return 'session_id/' + req.body.session_id + '/user_id/' + req.body.user_id + '/' + this.getId() + '.' + req.files.file.extension;
  },
  generateUrl: function(req, callback) {
    this.generateShortUrl(config.aws.base + req.body.session_id + '/user_id/' + req.body.user_id + '/' + this.getId() + '.' + req.files.file.extension, callback);
  },
  generateShortUrl: function(longUrl, callback){
    bitly.shorten(longUrl, function(err, res) {
      if (err) return callback(err);
      return callback(null, res.data.url);
    });
  }
}
