/**
 * User Controller
 */

'use strict';

var User = require('../models/user');
var Session = require('../models/session');
var Archive = require('../models/archive');
var AWS = require('aws-sdk');
var fs = require('fs');
var async = require('async');
var crypto = require('crypto');
var mailer = require('../config/utils/mailer');
var dialog = require('../config/utils/dialog');
var uploader = require('../config/utils/uploader');
var config = require('../config');
var utils = require('../config/utils');

var transporter = mailer.transporter();
AWS.config.update(config.aws.credens);
var s3Bucket = new AWS.S3();

exports.upload = function(req, res, next) {
  async.waterfall([
      function(callback) {
        console.log(req.files);
        if (req.files.file.extension !== 'jpg' && req.files.file.extension !== 'jpeg' && req.files.file.extension !== 'png' && req.files.file.extension !== 'gif') return res.status(401).send(dialog.badFileType);
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
          req.isProfileImg = true;
          uploader.generateUrl(req, function(profileUrl) {
            req.isProfileImg = false;
            callback(null, profileUrl)
          });
        })
      },
      function(profileUrl, callback) {
        User.findById(req.session.user._id, function(err, user) {
          if (err) return callback(err);
          user.profileImage = profileUrl;
          user.save(function(err, savedUser) {
            if (err) return callback(err);
            callback(null, profileUrl);
          });
        })
      }
    ],
    function(err, url) {
      if (err) return next(err);
      res.send(url);
    })
};

exports.connectAccts = function(req, res, next) {
  User.findById(req.body._id, function(err, user) {
    console.log('user', user);
    if (err) return next(err);
    user.username = req.body.username;
    user.password = req.body.password;
    user.save(function(err, savedUser) {
      if (err) return next(err);
      savedUser.password = null;
      req.session.user = savedUser;
      res.json({
        user: savedUser
      });
    })
  })
};

exports.saveUserName = function(req, res, next) {
  User.findById(req.body._id, function(err, user) {
    user.username = req.body.username;
    user.save(function(err, savedUser) {
      if (err) return next(err);
      savedUser.password = null;
      req.session.user = savedUser;
      res.json({
        user: savedUser
      });
    })
  })
}

exports.getOne = function(req, res, next) {
  User.findById(req.params.user_id, function(err, user) {
    if (err) return next(err);
    res.json({
      user: user
    });
  });
};

exports.getAll = function(req, res, next) {
  async.series({
      user: function(callback) {
        User.findById(req.params.user_id, function(err, user) {
          if (err) return callback(err);
          callback(null, user);
        });
      },
      sessions: function(callback) {
        var sessionArr = [];
        Session.find({
          users: {
            $elemMatch: {
              _id: req.params.user_id
            }
          }
        }, function(err, sessions) {
          if (err) return callback(err);
          if (!sessions.length) return callback(null, sessionArr);
          sessions.forEach(function(session) {
            session.key = config.openTok.key;
            session.secret = config.openTok.secret;
            sessionArr.push(session);
          })
          callback(null, sessionArr);
        });
      },
      archives: function(callback) {
        Archive.find({
          users: {
            $elemMatch: {
              _id: req.params.user_id
            }
          }
        }, function(err, archives) {
          if (err) return callback(err);
          if (!archives || archives && !archives.length) return callback(null, []);
          callback(null, archives);
        });
      }
    },
    function(err, results) {
      if (err) return next(err);
      req.session.user = results.user;
      req.session.otSessions = results.sessions;
      req.session.archives = results.archives;
      res.json({
        user: results.user,
        sessions: results.sessions,
        archives: results.archives
      });
    });
};

exports.logout = function(req, res, next) {
  req.session.destroy();
  res.status(401).end();
};

exports.update = function(req, res, next) {
  async.waterfall([
      function(callback) {

        if (req.body.connectFacebook) return exports.connectAccts(req, res, next);

        /* If the user is updating their password or their username */
        if (req.body.updated.password || req.body.updated.username) return callback(null);

        /* See if the email they want to update to is already registered */
        User.findOne({
          email: req.body.updated.email
        }, function(err, user) {
          if (err) return callback(err);
          if (user) return res.status(401).send(dialog.emailAlreadyExists);
          callback(null);
        })
      },
      function(callback) {

        /* Pull down the user by id */
        User.findById(req.body._id, function(err, user) {
          if (err) return callback(err);

          /* If no user is found */
          if (!user) return res.status(401).send(dialog.noAccountFound);

          /* If they are updating their username */
          if (req.body.updated.username) {
            user.username = req.body.updated.username;
          }

          /* If they are updating their email */
          if (req.body.updated.email) {
            user.oldEmail = user.email;
            user.email = req.body.updated.email;
          }

          /* If they are updating their password */
          if (req.body.updated.password) {
            user.password = req.body.updated.password;
          }

          /* Save the user and handle the error */
          user.save(function(err, savedUser) {
            if (err) return callback(err);
            if (!savedUser) return res.status(401).send(dialog.noAccountFound);
            callback(null, savedUser);
          });
        });
      },
      function(user, callback) {
        /* Generate the email template based on the attribute that was updated */
        if (req.body.updated.email) {
          mailer.generateTemplate('email', user, function(subject, html) {
            return callback(null, user, subject, html);
          });
        }
        if (req.body.updated.password) {
          mailer.generateTemplate('password', user, function(subject, html) {
            return callback(null, user, subject, html);
          });
        }
        if (req.body.updated.username) {
          mailer.generateTemplate('username', user, function(subject, html) {
            callback(null, user, subject, html);
          });
        }
      },
      function(user, subject, html, callback) {
        /* Email the user the 'updated profile' template */
        var mailOpts = {
          to: user.email,
          from: config.transport.email,
          subject: subject,
          html: html
        };
        transporter.sendMail(mailOpts, function(err, result) {
          if (err) return callback(err);
          callback(null, user, result);
        });
      },
      function(user, result, callback) {
        /* If the user updated their email, undefine their old email that was temporarily saved for the 'updated profile' email template  */
        if (user.oldEmail) {
          user.oldEmail = null;
          user.save(function(err) {
            if (err) return callback(err);
            /* Don't pass down the users hashed password to the client or store in session */
            user.password = null;
            /* Replace the old session obj with the user's new credentials  */
            req.session.user = user;
            callback(null);
          });
        }
      },
    ],
    function(err) {
      if (err) return next(err);
      res.json({
        user: req.session.user
      });
    })
};

exports.resetPass = function(req, res, next) {
  async.waterfall([
      function(callback) {
        crypto.randomBytes(20, function(err, buf) {
          if (err) return callback(err);
          var token = buf.toString('hex');
          callback(null, token);
        });
      },
      function(token, callback) {
        User.findOne({
          email: req.body.email
        }, function(err, user) {
          if (err) return callback(err);

          /* If the user's account is not found */
          if (!user) return res.status(401).send(dialog.noEmailFound);

          user.utils.resetPassToken = token;
          user.utils.resetPassExpires = Date.now() + 3600000; /* 1 hour */
          user.save(function(err, savedUser) {
            if (err) return callback(err);
            callback(null, token, savedUser);
          });
        });
      },
      function(token, user, callback) {
        var mailOpts = {
          to: user.email,
          from: config.transport.email,
          subject: mailer.emails.subject.resetPassword,
          html: mailer.emails.content.resetPassword(req.headers.host, token)
        };
        transporter.sendMail(mailOpts, function(err) {
          if (err) return callback(err);
          callback(null);
        });
      },
    ],
    function(err) {
      if (err) return next(err);
      res.send(dialog.resetSubmit);
    }
  )
};

exports.resetPassCallback = function(req, res, next) {
  User.findOne({
    'utils.resetPassToken': req.params.token,
    'utils.resetPassExpires': {
      $gt: Date.now()
    }
  }, function(err, user) {
    if (err) return next(err);
    res.render('reset-password');
  });
};

exports.resetPassSubmit = function(req, res, next) {
  async.waterfall([
      function(callback) {
        utils.parseUrl({
          type: 'resetPassSubmit',
          url: req.headers.referer
        }, function(token) {

          User.findOne({
            'utils.resetPassToken': token
          }, function(err, user) {
            if (err) return callback(err);

            user.password = req.body.password;
            user.utils.resetPassToken = null;
            user.utils.resetPassExpires = null;
            user.save(function(err, user) {
              if (err) return callback(err);
              callback(null, user)
            });
          });
        })
      },
      function(user, callback) {
        var mailOpts = {
          to: user.email,
          from: config.transport.email,
          subject: mailer.emails.subject.resetPasswordSuccess,
          html: mailer.emails.content.resetPasswordSuccess(user.email)
        };
        transporter.sendMail(mailOpts, function(err, result) {
          if (err) return callback(err);
          callback(null)
        });
      },
    ],
    function(err) {
      if (err) return next(err);
      res.redirect('/');
    });
};
