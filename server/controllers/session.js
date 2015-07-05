/**
 * Session Controller
 */

'use strict';

var Session = require('../models/session');
var User = require('../models/user');
var Video = require('../models/video');
var OpenTok = require('opentok');
var AWS = require('aws-sdk');
var fs = require('fs');
var validator = require('validator');
var request = require('request');
var async = require('async');
var moment = require('moment');
var mailer = require('../config/utils/mailer');
var dialog = require('../config/utils/dialog');
var uploader = require('../config/utils/uploader');
var request = require('request');
var config = require('../config');

AWS.config.update(config.aws.credens);
var s3Bucket = new AWS.S3();

var opentok = new OpenTok(config.openTok.key, config.openTok.secret);
var transporter = mailer.transporter();

exports.getVideoStatus = function(req, res, next) {

  var obj = {};

  Video.findOne({ archiveId: req.params.archive_id }, function(err, video) {
    if (err) return next(err);
    if (!video || video.status !== 'uploaded') {
      obj.isReady = false;
      res.status(200).send(obj);
    } else {
      obj.isReady = true;
      obj.video = video;
      res.status(200).send(obj);
    }
  });
};

exports.getAll = function(req, res, next) {
  var sessionArr = [];
  Session.find({
    users: {
      $elemMatch: {
        _id: req.params.user_id
      }
    }
  }, function(err, sessions) {
    if (err) return next(err);
    if (!sessions.length) return res.json({
      session: sessionArr
    });
    sessions.forEach(function(session) {
      session.key = config.openTok.key;
      session.secret = config.openTok.secret;
      sessionArr.push(session);
    })
    req.session.otSessions = sessionArr;
    res.json({
      sessions: sessionArr
    })
  });
};

exports.createRoom = function(req, res, next) {

  var tempPass;
  var name = req.body.name;
  var guestEmail = req.body.guestEmail;
  var startsAt = req.body.startsAt;
  var expiresAt = req.body.expiresAt;
  var startsAtObj = moment.utc(startsAt);
  var startsAtFormatted = req.body.startsAtFormatted;
  var host = req.body.host;

  async.waterfall([
      function(callback) {
        /* Validate the email */
        var isValid = validator.isEmail(guestEmail);
        if (!isValid || (guestEmail.length > 64)) return res.status(401).send(dialog.badEmail);
        callback(null);
      },
      function(callback) {
        /* See if the invited user already has an account */
        User.find({
          email: guestEmail
        }, function(err, guest) {
          if (err) return callback(err);
          if (!guest.length) return callback(null, null);
          callback(null, guest[0]);
        })
      },
      function(guest, callback) {
        var session = new Session();
        /* If the guest already has an account, push users to session.users arr */
        if (guest) {
          session.users.push(host, guest);
          return callback(null, null, session);
        }
        /* Otherwise create the user, assign temp pass, save and then push users to session.users arr */
        var newUser = new User();
        newUser.email = guestEmail;
        tempPass = newUser.generateTempPass();
        newUser.password = tempPass;
        newUser.save(function(err, guest) {
          if (err) return callback(err);
          session.users.push(host, guest);
          callback(null, guest, session);
        });
      },
      function(guest, session, callback) {

        /* Create the otSession and add to the Session Instance */
        opentok.createSession({
          mediaMode: 'routed'
        }, function(err, otSession) {

          session.key = config.openTok.key;
          session.secret = config.openTok.secret;
          session.sessionId = otSession.sessionId;
          session.token = opentok.generateToken(session.sessionId);
          session.createdBy.username = host.username;
          session.createdBy.user_id = host._id;
          session.name = name;
          session.startsAt = startsAt;
          session.expiresAt = expiresAt;
          session.save(function(err, savedSession) {
            console.log(158, savedSession)
            if (err) return callback(err);
            if (!guest) return callback(null, null, savedSession);
            callback(null, guest, savedSession);
          });
        });
      },
      function(guest, session, callback) {
        /* Send the guest an invitation */
        var mailOpts = {
          to: guestEmail,
          from: config.transport.email,
          subject: mailer.emails.subject.invite,
          html: guest ? mailer.emails.content.inviteNewAcct(guestEmail, tempPass, host.email) : mailer.emails.content.invite(host.email)
        };
        transporter.sendMail(mailOpts, function(err, results) {
          if (err) return callback(err);
          if (tempPass) tempPass = null;
          callback(null, session);
        })
      }
    ],
    function(err, otSession) {
      if (err) return next(err);
      res.json({
        session: otSession
      });
    }
  )
};

exports.upload = function(req, res, next) {
  async.waterfall([
      function(callback) {
        if (req.files.file.extension === 'exe') return res.status(401).send(dialog.badFileType);
        if (req.files.file.size > 5e+6) return res.status(401).send(dialog.maxSizeExceeded);
        callback(null);
      },
      function(callback) {
        fs.readFile(req.files.file.path, function(err, fileBody) {
          if (err) return callback(err);
          uploader.setId();
          callback(null, fileBody);
        })
      },
      function(fileBody, callback) {
        var params = {
          Bucket: config.aws.bucket,
          Key: uploader.generateKey(req),
          Body: fileBody,
          ContentType: req.files.file.mimetype,
          ACL: config.aws.acl
        };
        callback(null, params);
      },
      function(params, callback) {
        s3Bucket.putObject(params, function(err) {
          if (err) return callback(err);
          callback(null);
        });
      },
      function(callback) {
        fs.unlink(req.files.file.path, function(err) {
          if (err) return callback(err);
          var onShortUrl = function(err, url) {
            if (err) return callback(err);
            callback(null, url);
          };
          uploader.generateUrl(req, onShortUrl);
        })
      },
    ],
    function(err, url) {
      if (err) return next(err);
      res.send(url);
    })
};

exports.startRecording = function(req, res, next) {
  opentok.startArchive(req.params.session_id, {
    name: req.params.session_id
  }, function(err, archive) {
    if (err) return next(err);
    res.json(archive);
  });
};

exports.stopRecording = function(req, res, next) {
  opentok.stopArchive(req.params.archive_id, function(err, archive) {
    if (err) return next(err);
    res.json(archive);
  });
};

exports.getRecording = function(req, res, next) {
  opentok.getArchive(req.params.archive_id, function(err, archive) {
    if (err) return next(err);
    res.json(archive);
  });
};

exports.deleteRecording = function(req, res, next) {
  opentok.deleteArchive(req.params.archive_id, function(err, archive) {
    if (err) return next(err);
    archive.delete(function(err) {
      if (err) return next(err);
      res.status(200).end();
    });
  });
};

exports.generateVideoEmbed = function(req, res, next) {
    console.log('generateVideoEmbed', req.body);
    var partnerId = req.body.partnerId;
    var archiveId = req.body.archiveId;
    var url = 'https://room-baby-video-api.herokuapp.com/embed/' + partnerId + '/' + archiveId;
    console.log('url', url);
    request(url, function(error, response, body) {
      console.log("response", response);
      console.log('body', body);
    // if (!error && response.statusCode == 200) {
    //   console.log('body', body);
    //   console.log('');
    //   console.log('----------------');
    //   console.log('');
      // console.log('response', response);
    // }
  });
};

exports.getActiveUsers = function() {
  console.log('get active users');
};

exports.deleteSession = function(req, res, next) {
  Session.find({
    _id: req.params.session_id
  }).remove(function(err, session) {
    console.log('############## removed', session);
    if (err) return next(err);
    exports.getAll(req, res, next);
  })
};
