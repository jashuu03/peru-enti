const Registration = require('../models/Registration');
const Meetup = require('../models/Meetup');
const User = require('../models/User');
const { convertToCSV } = require('../utils/csvExport');

// @desc    Get dashboard analytics (admin only)
// @route   GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const totalMeetups = await Meetup.countDocuments();
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    
    const registrations = await Registration.find();
    const totalRegistrations = registrations.length;
    const totalCheckIns = registrations.filter(r => r.status === 'checked-in').length;
    
    const attendancePercentage = totalRegistrations > 0 
      ? Math.round((totalCheckIns / totalRegistrations) * 100) 
      : 0;

    // Calculate most active users (based on checked-in registrations)
    const activeUsersAggregation = await Registration.aggregate([
      { $match: { status: 'checked-in' } },
      { $group: { _id: '$user', checkInCount: { $sum: 1 } } },
      { $sort: { checkInCount: -1 } },
      { $limit: 5 }
    ]);

    const activeUserIds = activeUsersAggregation.map(item => item._id);
    const usersInfo = await User.find({ _id: { $in: activeUserIds } })
      .select('name email profilePicture profession company');

    const mostActiveUsers = activeUsersAggregation.map(item => {
      const userInfo = usersInfo.find(u => u._id.toString() === item._id.toString());
      return {
        user: userInfo,
        checkInCount: item.checkInCount
      };
    });

    res.json({
      totalMeetups,
      totalUsers,
      totalRegistrations,
      totalCheckIns,
      attendancePercentage,
      mostActiveUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get meetup specific analytics (admin only)
// @route   GET /api/analytics/meetup/:id
const getMeetupStats = async (req, res) => {
  try {
    const { id } = req.params;
    const meetup = await Meetup.findById(id);
    
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    const totalRegistrations = await Registration.countDocuments({ meetup: id });
    const totalCheckIns = await Registration.countDocuments({ meetup: id, status: 'checked-in' });
    
    const attendancePercentage = totalRegistrations > 0 
      ? Math.round((totalCheckIns / totalRegistrations) * 100) 
      : 0;

    res.json({
      meetupTitle: meetup.title,
      meetupDate: meetup.date,
      capacity: meetup.capacity,
      totalRegistrations,
      totalCheckIns,
      attendancePercentage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export CSV attendee list for a meetup (admin only)
// @route   GET /api/analytics/export/attendees/:meetupId
const exportAttendeesCSV = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const meetup = await Meetup.findById(meetupId);
    
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    const registrations = await Registration.find({ meetup: meetupId })
      .populate('user', 'name email profession company')
      .sort({ createdAt: -1 });

    const fields = [
      { label: 'Name', value: 'user.name' },
      { label: 'Email', value: 'user.email' },
      { label: 'Profession', value: 'user.profession' },
      { label: 'Company', value: 'user.company' },
      { label: 'Status', value: 'status' },
      { label: 'Registered At', value: 'createdAt' },
      { label: 'Checked In At', value: 'checkedInAt' }
    ];

    const csv = convertToCSV(registrations, fields);
    
    const filename = `attendees-${meetup.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export CSV responses (registration questions) (admin only)
// @route   GET /api/analytics/export/responses/:meetupId
const exportResponsesCSV = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const meetup = await Meetup.findById(meetupId);
    
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    const registrations = await Registration.find({ meetup: meetupId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const fields = [
      { label: 'Attendee Name', value: 'user.name' },
      { label: 'Attendee Email', value: 'user.email' },
      { label: 'Why Attend', value: 'whyAttend' },
      { label: 'What Learn', value: 'whatLearn' },
      { label: 'What Contribute', value: 'whatContribute' },
      { label: 'Registration Date', value: 'createdAt' }
    ];

    const csv = convertToCSV(registrations, fields);
    
    const filename = `responses-${meetup.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getMeetupStats,
  exportAttendeesCSV,
  exportResponsesCSV
};
