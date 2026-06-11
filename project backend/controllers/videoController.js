const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');

// @desc    Upload video (file OR YouTube URL)
// @route   POST /api/videos
const createVideo = async (req, res) => {
  try {
    const { title, description, meetupId, youtubeUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Video title is required' });
    }

    // Determine source: YouTube URL or uploaded file
    let filePath = '';
    let fileSize = 0;

    if (youtubeUrl) {
      // Validate it's a YouTube URL
      const ytPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
      if (!ytPattern.test(youtubeUrl)) {
        return res.status(400).json({ message: 'Invalid YouTube URL' });
      }
      filePath = youtubeUrl;
    } else if (req.file) {
      filePath = `/uploads/videos/${req.file.filename}`;
      fileSize = req.file.size;
    } else {
      return res.status(400).json({ message: 'Please provide a YouTube URL or upload an MP4 video file' });
    }

    // Expiry date is 28 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 28);

    const video = await Video.create({
      title,
      description: description || '',
      filePath,
      meetup: meetupId || null,
      uploadedBy: req.user._id,
      expiresAt,
      fileSize
    });

    await video.populate('uploadedBy', 'name profilePicture');
    if (video.meetup) {
      await video.populate('meetup', 'title date');
    }

    res.status(201).json(video);
  } catch (error) {
    // If database insertion fails, remove uploaded file
    if (req.file) {
      const fp = path.join(__dirname, '..', 'uploads/videos', req.file.filename);
      if (fs.existsSync(fp)) {
        fs.unlinkSync(fp);
      }
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active videos (non-expired)
// @route   GET /api/videos
const getVideos = async (req, res) => {
  try {
    const now = new Date();
    // Only return videos that haven't expired yet
    const videos = await Video.find({ expiresAt: { $gt: now } })
      .populate('uploadedBy', 'name profilePicture')
      .populate('meetup', 'title date')
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete video manually
// @route   DELETE /api/videos/:id
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Only allow admin or video creator to delete
    if (video.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    // Remove file only for uploaded videos (not YouTube links)
    if (video.filePath && video.filePath.startsWith('/uploads/')) {
      const absolutePath = path.join(__dirname, '..', video.filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createVideo, getVideos, deleteVideo };
