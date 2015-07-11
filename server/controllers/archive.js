/**
 * Archive Controller
 */

'use strict';

var Archive = require('../models/archive');

exports.createArchive = function(req, res, next) {
  var archive = new Archive(req.body);
  archive.generateShortUrl(archive.longUrl, function(err, shortUrl) {
    if (err) return next(err);
    archive.shortUrl = shortUrl
    archive.save(function(err, savedArchive) {
      if (err) return next(err);
      res.status(200).json(savedArchive);
    });
  });
};

exports.getAll = function(req, res, next) {
  Archive.find({
    users: {
      $elemMatch: {
        _id: req.params.user_id
      }
    }
  }, function(err, archives) {
    if (err) return next(err);
    if (err) console.log('err', err);
    console.log('on getAll archives');
    res.status(200).json(archives);
  })
}
