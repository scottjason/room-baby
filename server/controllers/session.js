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
var mailer = require('../config/utils/mailer');
var dialog = require('../config/utils/dialog');
var uploader = require('../config/utils/uploader');
var config = require('../config');

AWS.config.update(config.aws.credens);
var s3Bucket = new AWS.S3();

var opentok = new OpenTok(config.openTok.key, config.openTok.secret);
var transporter = mailer.transporter();

exports.getAll = function(req, res, next) {
  var sessionArr = [];
  Session.find({ users: { $elemMatch: { _id: req.params.user_id } } }, function (err, sessions) {
    console.log(sessions);
    if (err) return next(err);
    if(!sessions.length) return res.json({ session: sessionArr });
    sessions.forEach(function(session){
      session.key = config.openTok.key;
      session.secret = config.openTok.secret;
      sessionArr.push(session);
    })
    res.json({ session: sessionArr })
  });
};

exports.create = function(req, res, next) {
  async.waterfall([
    function(callback) {
    /* Validate the email */
     var isValid = validator.isEmail(req.body.invitedUser.email);
     if(!isValid || req.body.invitedUser.email.length > 64) return res.status(401).send(dialog.badEmail);
     callback(null);
    },
    function(callback) {
    /* See if the invited user already has an account */
      User.find({ email: req.body.invitedUser.email }, function(err, user){
        if(err) return callback(err);
        if(!user.length) return callback(null, null);
        callback(null, user[0]);
      })
    },
    function(invitedUser, callback){
      var session = new Session();
    /* If the invited user has an account, push users to session.users arr */
      if(invitedUser) {
        session.users.push(req.body.connectedUser, invitedUser);
        return callback(null, null, session);
      }
    /* Otherwise create the user, assign temp pass, save and then push users to session.users arr */
      var newUser = new User();
      newUser.email = req.body.invitedUser.email;
      req.tempPass = newUser.generateTempPass();
      newUser.password = req.tempPass;
      newUser.save(function(err, savedUser){
        if(err) return callback(err);
        session.users.push(req.body.connectedUser, savedUser);
        callback(null, savedUser, session);
      });
    },
    function(newUser, session, callback) {
      /* Create the otSession and add to the Session Instance */
      opentok.createSession({ mediaMode: 'routed' }, function(err, otSession) {
        if (err) return callback(err)
        /* Iterate over each user obj in the session.users arr */
        async.map(session.users, session.generateUserObj, function(err, usersArr){
          if(err) return callback(err);
        /* Redfine session.users to the resulting arr of filtered user objects */
          session.users = usersArr;
          session.sessionId = otSession.sessionId;
          session.token = opentok.generateToken(session.sessionId);
          session.createdBy.username = req.body.connectedUser.username;
          session.createdBy.user_id = req.body.connectedUser._id;
          session.name = req.body.invitedUser.title;
          /* Save the session with the arr of now filtered user objects */
          session.save(function(err, savedSession){
          /* Add credens to the session object after saving and before passing to the client */
            if(err) return callback(err);
            savedSession.key = config.openTok.key;
            savedSession.secret = config.openTok.secret;
            if(!newUser) return callback(null, null, savedSession);
            callback(null, newUser, savedSession);
          })
        });
      });
    },
    function(newUser, session, callback) {
    /* Send the guest an invitation */
        var mailOpts = {
          to: req.body.invitedUser.email,
          from: config.transport.email,
          subject: mailer.emails.subject.invite,
          html: newUser ? mailer.emails.content.inviteNewAcct(newUser.email, req.tempPass, req.body.connectedUser.email) : mailer.emails.content.invite(req.body.connectedUser.email)
        };
        transporter.sendMail(mailOpts, function(err, results) {
          if (err) return callback(err);
          if(req.tempPass) req.tempPass = null;
          req.session.otSession = session;
          callback(null, req.session.otSession, results);
       })
      }
   ],
    function(err, otSession, results) {
      if (err) return next(err);
      res.json({ session: otSession });
    }
  )
};


exports.upload = function(req, res, next) {
  async.waterfall([
      function(callback) {
        if(req.files.file.extension === 'exe') return res.status(401).send(dialog.badFileType);
        if(req.files.file.size > 5e+6) return res.status(401).send(dialog.maxSizeExceeded);
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
        callback(null, params)
      },
      function(params, callback) {
        s3Bucket.putObject(params, function(err) {
          if (err) return callback(err);
          callback(null);
        });
      },
      function(callback){
        fs.unlink(req.files.file.path, function(err) {
          if (err) return callback(err);
          var onShortUrl = function(err, url) {
            if(err) return callback(err);
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
  opentok.startArchive(req.params.session_id, { name: req.params.session_id }, function (err, archive) {
    if (err) return next(err);
    res.json(archive);
  });
};

exports.stopRecording = function(req, res, next) {
  opentok.stopArchive(req.params.archive_id, function (err, archive) {
    if (err) return next(err);
    res.json(archive);
  });
};

exports.getRecording = function(req, res, next) {
  opentok.getArchive(req.params.archive_id, function (err, archive) {
      if (err) return next(err);
      res.json(archive);
  });
};

exports.deleteRecording = function(req, res, next) {
  opentok.deleteArchive(req.params.archive_id, function (err, archive) {
    if (err) return next(err);
    archive.delete(function (err) {
      if (err) return next(err);
      res.status(200).end();
    });
  });
};

exports.generateVideoEmbed = function(req, res, next) {
  var url = 'https://video-ready-api.herokuapp.com/' + req.params.archive_id + '/' + req.params.partner_id;
  request(url, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log('body', body);
    console.log('');
    console.log('----------------');
    console.log('');
    console.log('response', response);
  }
})
};

exports.videoStatus = function(req, res, next) {
  Video.findOne({ 'archiveId': req.params.archive_id }, function(err, video){
    if(err) return next(err);
    if(video) console.log('found video', video);
    if(!video || !video.status || video.status !== 'uploaded') return res.send(dialog.videoNotReady);
    res.json(video);
  })
};

exports.deleteSession = function(req, res, next) {
  Session.findOneAndRemove({ _id: req.params.session_id }, function(err, session){
    if(err) return next(err);
    exports.getAll(req, res, next);
  })
};