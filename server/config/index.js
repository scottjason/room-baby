/**
 * Main Config
 */

'use strict';

var env = {};
var path = require('path');

console.log('#####', process.env.NODE_ENV);

if (process.env.NODE_ENV !== 'production') {
  env = require('../../env.js');
}

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
  sessionOpts: {
    saveUninitialized: true,
    resave: true,
    secret: process.env.SESSION_SECRET || env.SESSION_SECRET,
    cookie: {
      maxAge: new Date(Date.now() + 1209600000),
      expires: new Date(Date.now() + 1209600000)
    }
  },
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
};
