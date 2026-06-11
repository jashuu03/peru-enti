const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meetup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meetup',
    required: true
  },
  whyAttend: {
    type: String,
    required: [true, 'Please tell us why you want to attend'],
    maxlength: 1000
  },
  whatLearn: {
    type: String,
    required: [true, 'Please tell us what you want to learn'],
    maxlength: 1000
  },
  whatContribute: {
    type: String,
    required: [true, 'Please tell us what you can contribute'],
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['registered', 'checked-in'],
    default: 'registered'
  },
  checkedInAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Prevent duplicate registrations
registrationSchema.index({ user: 1, meetup: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
