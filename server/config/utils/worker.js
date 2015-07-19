var CronJob = require('cron').CronJob;
var Session = require('../../models/session');
var juice = require('juice2');
var config = require('../../config');
var mailer = require('../../config/utils/mailer');
var path = require('path');
var transporter = mailer.transporter();


var template = path.join(config.root, 'server/views/mailer/invite.html');

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


exports.sendMail = function() {
  juice(template, function(err, html) {
    var mailOpts = {
      to: 'scottleejason@gmail.com',
      from: config.transport.email,
      subject: 'Invite Test',
      html: html
    };
    transporter.sendMail(mailOpts, function(err, results) {
      console.log(err || results)
    });
  });
}
