const mongoose = require('mongoose');

const meetupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  banner: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 5000
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  mapsLink: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Virtual for registration count
meetupSchema.virtual('registrationCount', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'meetup',
  count: true
});

meetupSchema.set('toJSON', { virtuals: true });
meetupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Meetup', meetupSchema);
