const Meetup = require('../models/Meetup');
const Registration = require('../models/Registration');

// @desc    Get all meetups
// @route   GET /api/meetups
const getMeetups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
      if (status === 'upcoming') {
        query.status = { $in: ['upcoming', 'ongoing'] };
      } else {
        query.status = status;
      }
    }

    const meetups = await Meetup.find(query)
      .populate('organizer', 'name email profilePicture')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Get registration counts for each meetup
    const meetupsWithCounts = await Promise.all(
      meetups.map(async (meetup) => {
        const registeredCount = await Registration.countDocuments({ meetup: meetup._id });
        const checkedInCount = await Registration.countDocuments({ meetup: meetup._id, status: 'checked-in' });
        return {
          ...meetup.toObject(),
          registeredCount,
          checkedInCount
        };
      })
    );

    const total = await Meetup.countDocuments(query);

    res.json({
      meetups: meetupsWithCounts,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single meetup
// @route   GET /api/meetups/:id
const getMeetup = async (req, res) => {
  try {
    const meetup = await Meetup.findById(req.params.id)
      .populate('organizer', 'name email profilePicture profession company');

    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    const registrations = await Registration.find({ meetup: meetup._id })
      .populate('user', 'name email profilePicture profession company lookingFor');

    const registeredMembers = registrations
      .filter(r => r.status === 'registered')
      .map(r => ({
        user: r.user,
        responses: { whyAttend: r.whyAttend, whatLearn: r.whatLearn, whatContribute: r.whatContribute },
        registeredAt: r.createdAt
      }));

    const checkedInMembers = registrations
      .filter(r => r.status === 'checked-in')
      .map(r => ({
        user: r.user,
        responses: { whyAttend: r.whyAttend, whatLearn: r.whatLearn, whatContribute: r.whatContribute },
        checkedInAt: r.checkedInAt
      }));

    res.json({
      ...meetup.toObject(),
      registeredMembers,
      checkedInMembers,
      registeredCount: registrations.length,
      checkedInCount: checkedInMembers.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create meetup (admin)
// @route   POST /api/meetups
const createMeetup = async (req, res) => {
  try {
    const {
      title, description, date, startTime, endTime,
      venue, mapsLink, capacity, registrationDeadline
    } = req.body;

    const meetup = await Meetup.create({
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      mapsLink: mapsLink || '',
      capacity: parseInt(capacity),
      registrationDeadline,
      banner: req.file ? `/uploads/banners/${req.file.filename}` : '',
      organizer: req.user._id
    });

    await meetup.populate('organizer', 'name email profilePicture');

    res.status(201).json(meetup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update meetup (admin)
// @route   PUT /api/meetups/:id
const updateMeetup = async (req, res) => {
  try {
    const meetup = await Meetup.findById(req.params.id);
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.banner = `/uploads/banners/${req.file.filename}`;
    }
    if (updates.capacity) {
      updates.capacity = parseInt(updates.capacity);
    }

    const updated = await Meetup.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('organizer', 'name email profilePicture');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete meetup (admin)
// @route   DELETE /api/meetups/:id
const deleteMeetup = async (req, res) => {
  try {
    const meetup = await Meetup.findById(req.params.id);
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    await Registration.deleteMany({ meetup: meetup._id });
    await Meetup.findByIdAndDelete(req.params.id);

    res.json({ message: 'Meetup deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get past meetups (history)
// @route   GET /api/meetups/history
const getMeetupHistory = async (req, res) => {
  try {
    const meetups = await Meetup.find({
      date: { $lt: new Date() }
    })
      .populate('organizer', 'name email profilePicture')
      .sort({ date: -1 });

    const meetupsWithStats = await Promise.all(
      meetups.map(async (meetup) => {
        const registeredCount = await Registration.countDocuments({ meetup: meetup._id });
        const checkedInCount = await Registration.countDocuments({ meetup: meetup._id, status: 'checked-in' });
        return {
          ...meetup.toObject(),
          registeredCount,
          checkedInCount,
          attendanceRate: registeredCount > 0 ? ((checkedInCount / registeredCount) * 100).toFixed(1) : 0
        };
      })
    );

    res.json(meetupsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMeetups, getMeetup, createMeetup, updateMeetup, deleteMeetup, getMeetupHistory };
