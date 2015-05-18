/**
 * Index Controller
 */

'use strict';

var config = require('../config');

exports.render = function(req, res, next) {
  res.sendFile(config.root + 'client/index.html');
}

exports.isAuthenticated = function(req, res, callback) {
  if (!req.session.user) return res.redirect('/');
  callback();
}
