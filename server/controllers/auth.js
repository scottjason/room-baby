/**
 * Auth Controller
 */

'use strict';

exports.isAuthenticated = function(req, res, callback) {
  if(req.route.path === '/authenticate'){
  	if (!req.session || !req.session.user) return res.status(401).end();
    if(req.session.user && req.session.otSession) return res.json({ user: req.session.user, session:req.session.otSession })
    return res.json({user:req.session.user});
    }
  if (!req.session.user) return res.status(401).end();
  callback();
};