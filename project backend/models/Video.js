const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  filePath: {
    type: String,
    required: true
  },
  meetup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meetup',
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for finding expired videos
videoSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Video', videoSchema);
