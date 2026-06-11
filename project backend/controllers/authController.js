const User = require('../models/User');
const Message = require('../models/Message');
const { generateToken } = require('../middleware/auth');

// Welcome messages sent from admin to new users on signup
const WELCOME_MESSAGES = [
  `Hey {name}! 👋 Welcome to Peru Enti — we're super excited to have you here! This is the community hub where local professionals connect, collaborate, and grow together.`,
  `A quick tip to get started: head over to the Networking tab to discover other members, and check the Dashboard for upcoming meetups in your area. Don't forget to complete your profile so others can find you! 🚀`,
  `If you ever need help or have questions, just message me here anytime. Looking forward to seeing you at our next event! 🎉`
];

// Seed welcome chat messages from admin to newly registered user
const seedWelcomeMessages = async (newUserId, newUserName) => {
  try {
    // Find the first admin user
    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (!admin || admin._id.toString() === newUserId.toString()) return;

    // Create welcome messages with staggered timestamps
    const now = Date.now();
    for (let i = 0; i < WELCOME_MESSAGES.length; i++) {
      await Message.create({
        sender: admin._id,
        receiver: newUserId,
        content: WELCOME_MESSAGES[i].replace('{name}', newUserName),
        flagged: false,
        read: false,
        createdAt: new Date(now + i * 2000), // stagger by 2 seconds each
        updatedAt: new Date(now + i * 2000)
      });
    }
  } catch (err) {
    // Non-critical — don't fail signup if this fails
    console.error('Welcome message seeding error:', err.message);
  }
};

// @desc    Register new user
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password, profession, company, lookingFor } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if this is the first user -> make admin
    const userCount = await User.countDocuments();
    const finalRole = userCount === 0 ? 'admin' : 'user';

    // Parse lookingFor if it's a string
    let interests = lookingFor;
    if (typeof lookingFor === 'string') {
      interests = lookingFor.split(',').map(s => s.trim()).filter(Boolean);
    }

    const user = await User.create({
      name,
      email,
      password,
      profession: profession || '',
      company: company || '',
      profilePicture: req.file ? `/uploads/profiles/${req.file.filename}` : '',
      lookingFor: interests || [],
      role: finalRole
    });

    const token = generateToken(user._id);

    // Seed welcome messages from admin (non-blocking)
    seedWelcomeMessages(user._id, user.name);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profession: user.profession,
      company: user.company,
      profilePicture: user.profilePicture,
      lookingFor: user.lookingFor,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Login user
// @route   POST /api/auth/signin
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profession: user.profession,
      company: user.company,
      profilePicture: user.profilePicture,
      lookingFor: user.lookingFor,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, signin, getMe };
