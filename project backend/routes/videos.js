const express = require('express');
const router = express.Router();
const { createVideo, getVideos, deleteVideo } = require('../controllers/videoController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');

router.use(protect);

router.get('/', getVideos);

// Upload is optional — admin can provide a YouTube URL instead of a file
router.post('/', adminOnly, uploadVideo.single('video'), createVideo);

router.delete('/:id', adminOnly, deleteVideo);

module.exports = router;
