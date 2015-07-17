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
      req.session.archives = req.session.archives ? req.session.archives : [];
      req.session.archives.push(savedArchive);
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
    console.log('on getall archives', archives);
    if (err) return next(err);
    req.session.archives = archives;
    res.status(200).json(archives);
  })
}
