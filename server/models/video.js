var mongoose = require('mongoose');

var videoSchema = new mongoose.Schema({
  url: String,
  status: String,
  name: String,
  archiveId: String,
  sessionId: String,
  partnerId: Number,
  createdAt: Date,
  size: Number,
  duration: Number,
  updatedAt: Number
});

module.exports = mongoose.model('Video', videoSchema);
