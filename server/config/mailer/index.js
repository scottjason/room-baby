/**
 * Mailer Util
 */

'use strict';

var config = require('../');
var nodemailer = require('nodemailer');
var path = require('path');

module.exports = {
  transporter: function() {
    var transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.transport.email,
        pass: config.transport.password
      }
    });
    return transport;
  },
  generateTemplate: function(type, user, callback) {
    if (type === 'email') {
      return callback(this.emails.subject.updatePasswordSuccess, this.emails.content.updateEmailSuccess(user.email, user.oldEmail));
    }
    if (type === 'password') {
      return callback(this.emails.subject.updatePasswordSuccess, this.emails.content.updatePasswordSuccess(user.email));
    }
    if (type === 'username') {
      return callback(this.emails.subject.updateUserNameSuccess, this.emails.content.updateUserNameSuccess(user.email, user.username, user.password));
    }
  },
  emails: {
    subject: {
      invite: "You've been invited to a reserved room at Room Baby.",
      resetPassword: "Your Room Baby Reset Password Link",
      resetPasswordSuccess: "Your Room Baby Password Has Been Reset",
      updateEmailSuccess: "Your Room Baby Email Has Been Updated",
      updatePasswordSuccess: "Your Room Baby Password Has Been Updated",
      updateUserNameSuccess: "Your Room Baby Username Has Been Updated"
    },
    content: {
      invite: function(hostEmail) {
        return "Hi From Room Baby!" +
          "<br>" +
          "<br>" +
          "You've been invited to a reserved room at Room Baby by " + hostEmail + "." +
          "<br>" +
          "<br>" +
          "Please login or signup to connect." +
          "<br>" +
          "<br>" +
          "~ Room Baby"
      },
      inviteNewAcct: function(guestEmail, tempPass, hostEmail) {
        return "Hi From Room Baby!" +
          "<br>" +
          "<br>" +
          "You've been invited to a reserved room at Room Baby by " + hostEmail + "." +
          "<br>" +
          "<br>" +
          "An account has been created for you with a temporary password." +
          "Please login with the following credendtials. You may reset your password once logged in." +
          "<br>" +
          "<br>" +
          "-------------------------------------------" +
          "<br>" +
          "email: " + guestEmail +
          "<br>" +
          "<br>" +
          "temporary password: " + tempPass +
          "<br>" +
          "-------------------------------------------" +
          "<br>" +
          "<br>" +
          "~ Room Baby"
      },
      resetPassword: function(host, token) {
        return "You are receiving this because you (or someone else) has requested to reset the password for your account at Room Baby." +
          "<br>" +
          "<br>" +
          "Please click on the following link, or paste this into your browser to complete the process:" +
          "<br>" +
          "<br>" +
          "http://" + host + "/user/reset/" + token +
          "<br>" +
          "<br>" +
          "This link will remain active for one hour." +
          "<br>" +
          "<br>" +
          "If you did not request this, please ignore this email and your password will remain unchanged." +
          "<br>" +
          "<br>" +
          "~ Room Baby"
      },
      resetPasswordSuccess: function(email) {
        return "This is a confirmation that the password for your account " + email + " has been successfully updated." +
          "<br>" +
          "<br>" +
          "~ Room Baby"
      },
      updateEmailSuccess: function(newEmail, oldEmail) {
        return "This is a confirmation that the email address for your account at Room Baby has been successfully changed." +
          "<br>" +
          "<br>" +
          "Your previously registered email address: " +
          "<br>" +
          oldEmail +
          "<br>" +
          "<br>" +
          "-----------------------------" +
          "<br>" +
          "<br>" +
          "has been removed and updated to: " +
          "<br>" +
          newEmail + "." +
          "<br>" +
          "<br>" +
          "~ Room Baby"
      },
      updatePasswordSuccess: function(email) {
        return "This is a confirmation that the password for your account " + email + " has been successfully updated." +
          "<br>" +
          "<br>" +
          "~ Room Baby"
      },
      updateUserNameSuccess: function(email, username, password) {
        return "This is a confirmation that the username for your account " + email + " has been successfully updated to " + username + '.' +
          "and the following password has be generated: " + password + '.' +
          "<br>" +
          "Feel free to change your password and you may now login with either your facebook or email." +
          "<br>" +
          "<br>" +
          "~ Room Baby"
      }
    }
  }
}
