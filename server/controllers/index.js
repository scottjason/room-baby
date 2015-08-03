/**
 * Index Controller
 */

'use strict';

var config = require('../config');

exports.render = function(req, res, next) {
  var isFacebookBroadcast = (req.query.fb_ref === 'Default');
  if (!isFacebookBroadcast) {
    res.sendFile(config.root + 'server/views/index.html');
  } else {
    var redirectLink = req.params.broadcast_id;
    res.redirect(redirectLink);
  }
};
