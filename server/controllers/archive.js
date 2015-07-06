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
      if (err) console.log('err', err);
      console.log('savedArchive', savedArchive);
      if (err) return next(err);
      res.status(200).json(savedArchive);
    });
  });
};
