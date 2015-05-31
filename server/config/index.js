/**
 * Main Config
 */

'use strict';

var path = require('path');
var env = require('../../env.js');

module.exports = {
  db: {
    uri:process.env.MONGOLAB_URI || env.MONGOLAB_URI_DEV_SCOTT,
    opts: {
      server: {
        socketOptions: {
          keepAlive: 1
        }
      }
    }
  },
  server: {
    port: process.env.PORT || 3000
  },
  root: path.normalize(__dirname + '../../../'),
  sessionOpts: {
    saveUninitialized: true,
    resave: true,
    secret: env.SESSION_SECRET,
    cookie: {
      maxAge: new Date(Date.now() + 1209600000),
      expires: new Date(Date.now() + 1209600000)
    }
  },
  transport: {
    email: env.EMAIL,
    password: env.PASSWORD
  },
  openTok: {
    key: env.OT_KEY,
    secret: env.OT_SECRET
  },
  seed: {
    userOne: {
      username: env.USERNAME_ONE_SEED,
      email: env.EMAIL_ONE_SEED,
      password: env.PASSWORD_ONE_SEED
    },
    userTwo: {
      username: env.USERNAME_TWO_SEED,
      email: env.EMAIL_TWO_SEED,
      password: env.PASSWORD_TWO_SEED
    },
    userThree: {
      email: env.EMAIL_THREE_SEED
    },
    userFour: {
      email: env.EMAIL_FOUR_SEED
    },
    me: {
      username: env.USERNAME_ME_SEED,
      email: env.EMAIL_ME_SEED,
      password: env.PASSWORD_ME_SEED
    },
  },
  aws: {
    credens: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION
    },
    bucket: env.S3_BUCKET,
    acl: env.S3_ACL,
    base: env.S3_BASE
  },
  bitly: {
    username: env.BITLY_LOGIN,
    key: env.BITLY_KEY
  },

  facebook: {
    clientID: env.FACEBOOK_ID,
    clientSecret: env.FACEBOOK_SECRET,
    callbackURL: env.FACEBOOK_CB
  },
  apis: {
    activeUsers: env.ACTIVE_USERS_API,
    activeUsersApiKey: env.ACTIVE_USERS_API_KEY
  }
}
