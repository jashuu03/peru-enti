const User = require('../models/User');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-blockedUsers');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, profession, company, lookingFor } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (profession !== undefined) user.profession = profession;
    if (company !== undefined) user.company = company;
    if (lookingFor) {
      user.lookingFor = typeof lookingFor === 'string'
        ? lookingFor.split(',').map(s => s.trim()).filter(Boolean)
        : lookingFor;
    }
    if (req.file) {
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (for networking)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = {
      _id: { $ne: req.user._id }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { profession: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-blockedUsers')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
const blockUser = async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);
    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    user.blockedUsers.push(req.params.id);
    await user.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/block
const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter(
      id => id.toString() !== req.params.id
    );
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUserProfile, updateProfile, getAllUsers, blockUser, unblockUser };
