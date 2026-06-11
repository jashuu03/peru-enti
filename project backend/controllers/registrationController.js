const Registration = require('../models/Registration');
const Meetup = require('../models/Meetup');

// @desc    Register for a meetup
// @route   POST /api/registrations
const registerForMeetup = async (req, res) => {
  try {
    const { meetupId, whyAttend, whatLearn, whatContribute } = req.body;

    // Check if meetup exists
    const meetup = await Meetup.findById(meetupId);
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    // Check registration deadline
    if (new Date() > new Date(meetup.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check capacity
    const currentRegistrations = await Registration.countDocuments({ meetup: meetupId });
    if (currentRegistrations >= meetup.capacity) {
      return res.status(400).json({ message: 'Meetup is at full capacity' });
    }

    // Check if already registered
    const existing = await Registration.findOne({ user: req.user._id, meetup: meetupId });
    if (existing) {
      return res.status(400).json({ message: 'You are already registered for this meetup' });
    }

    const registration = await Registration.create({
      user: req.user._id,
      meetup: meetupId,
      whyAttend,
      whatLearn,
      whatContribute
    });

    await registration.populate('user', 'name email profilePicture profession company');

    res.status(201).json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check in to a meetup
// @route   POST /api/registrations/:meetupId/checkin
const checkIn = async (req, res) => {
  try {
    const { meetupId } = req.params;

    const registration = await Registration.findOne({
      user: req.user._id,
      meetup: meetupId
    });

    if (!registration) {
      return res.status(404).json({ message: 'You are not registered for this meetup' });
    }

    if (registration.status === 'checked-in') {
      return res.status(400).json({ message: 'You have already checked in' });
    }

    registration.status = 'checked-in';
    registration.checkedInAt = new Date();
    await registration.save();

    await registration.populate('user', 'name email profilePicture profession company');

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendees for a meetup
// @route   GET /api/registrations/:meetupId/attendees
const getAttendees = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const status = req.query.status; // 'registered' or 'checked-in'

    const query = { meetup: meetupId };
    if (status) query.status = status;

    const attendees = await Registration.find(query)
      .populate('user', 'name email profilePicture profession company')
      .sort({ createdAt: -1 });

    const checkedInCount = await Registration.countDocuments({
      meetup: meetupId,
      status: 'checked-in'
    });

    res.json({
      attendees,
      checkedInCount,
      totalCount: attendees.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's registration status for a meetup
// @route   GET /api/registrations/:meetupId/status
const getRegistrationStatus = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user._id,
      meetup: req.params.meetupId
    });

    res.json({
      isRegistered: !!registration,
      status: registration?.status || null,
      registration
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerForMeetup, checkIn, getAttendees, getRegistrationStatus };
