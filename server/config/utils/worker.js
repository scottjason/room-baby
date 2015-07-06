var CronJob = require('cron').CronJob;
var Session = require('../../models/session');

exports.start = function() {

  new CronJob('*/30 * * * * *', function() {
    Session.find({}, function(err, sessions) {
      sessions.forEach(function(session) {
        var currentMsUtc = new Date().getTime();
        var expiresAtMsUtc = session.expiresAt;
        var isExpired = (expiresAtMsUtc - currentMsUtc <= 0);
        if (isExpired) {
          exports.deleteSession(session._id);
        }
      });
    });
  }, null, true, "America/Los_Angeles");
};

exports.deleteSession = function(sessionId) {
  Session.find({
    _id: sessionId
  }).remove(function(err, session) {
  	if (err) console.log(err);
    console.log('#### Worker Removed Expired Session', session);
  });
};
