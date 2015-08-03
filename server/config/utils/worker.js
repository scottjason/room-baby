var CronJob = require('cron').CronJob;
var Session = require('../../models/session');
var config = require('../../config');

exports.start = function() {
  new CronJob('*/30 * * * * *', function() {
    var currentMsUtc = new Date().getTime();
    Session.where('expiresAt').lte(currentMsUtc).remove(function(err, numAffected) {
      if (err) {
        console.log('#### Worker Error Removing Expired Session', err);
      } else {
        console.log('#### Worker Results, Number Of Removed Sessions:', numAffected);
      }
    });
  }, null, true, "America/Los_Angeles");
};

