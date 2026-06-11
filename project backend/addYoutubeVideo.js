const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Video = require('./models/Video');
const User = require('./models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find the admin user to use as uploader
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found. Run seed.js first.');
      process.exit(1);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 28);

    const video = await Video.create({
      title: 'Quick Tech Tips — Must-Watch Short',
      description: 'A trending tech short from YouTube covering rapid developer productivity tricks and tools.',
      filePath: 'https://www.youtube.com/shorts/gT635E5wwKo',
      uploadedBy: admin._id,
      expiresAt,
      fileSize: 0
    });

    console.log('YouTube video added successfully!');
    console.log('Video ID:', video._id);
    console.log('Title:', video.title);
  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

run();
