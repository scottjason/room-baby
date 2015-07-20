/**
 * Index Controller
 */

'use strict';

var config = require('../config');
var Broadcast = require('../models/broadcast');

exports.render = function(req, res, next) {
  var isFacebookBroadcast = (req.query.fb_ref === 'Default');
  console.log('isFacebookBroadcast', isFacebookBroadcast)
  if (!isFacebookBroadcast) {
    res.sendFile(config.root + 'server/views/index.html');
  } else {
  	console.log("#### IS FACEBOOK REDIRECT");
  	var redirectLink = req.params.broadcast_id;

    res.redirect(redirectLink);
      // res.redirect(redirectLink);
  }
};
exports.getBroadcast = function(req, res, next) {
  // console.log('##### getBroadcast Called', req);
  // var broadcastId = req.params.broadcast_id;
  // Broadcast.findById(broadcastId, function(err, broadcast) {
  // res.send(broadcast);
  // });
}
