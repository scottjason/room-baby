/**
 * Main Config
 */

'use strict';

var path = require('path');

var env = (process.env.NODE_ENV === 'production') ? {} : require('../../env.js');

module.exports = {
  db: {
    uri: process.env.MONGOLAB_URI || env.MONGOLAB_URI_DEV,
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
  transport: {
    email: process.env.EMAIL || env.EMAIL,
    password: process.env.PASSWORD || env.PASSWORD
  },
  openTok: {
    key: process.env.OT_KEY || env.OT_KEY,
    secret: process.env.OT_SECRET || env.OT_SECRET
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
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || env.AWS_REGION
    },
    bucket: process.env.S3_BUCKET || env.S3_BUCKET,
    acl: process.env.S3_ACL || env.S3_ACL,
    base: process.env.S3_BASE || env.S3_BASE
  },
  bitly: {
    username: process.env.BITLY_LOGIN || env.BITLY_LOGIN,
    key: process.env.BITLY_KEY || env.BITLY_KEY
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID || env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET || env.FACEBOOK_SECRET,
    callbackURL: process.env.FACEBOOK_CB || env.FACEBOOK_CB
  },
  apis: {
    activeUsers: process.env.ACTIVE_USERS_API || env.ACTIVE_USERS_API,
    activeUsersApiKey: process.env.ACTIVE_USERS_API_KEY || env.ACTIVE_USERS_API_KEY,
    videoStatus: process.env.VIDEO_STATUS_API || env.VIDEO_STATUS_API
  },
  newRelic: {
    key: process.env.NEW_RELIC_LICENSE_KEY || env.NEW_RELIC_LICENSE_KEY
  },
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY || env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN || env.MAILGUN_DOMAIN
  }
};
