const express = require('express');
const router = express.Router();
const { getMeetups, getMeetup, createMeetup, updateMeetup, deleteMeetup, getMeetupHistory } = require('../controllers/meetupController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadBanner } = require('../middleware/upload');

router.use(protect);

router.get('/', getMeetups);
router.get('/history', getMeetupHistory);
router.get('/:id', getMeetup);

// Meetup creation is open to all users
router.post('/', uploadBanner.single('banner'), createMeetup);

// Update and delete are restricted to admins
router.put('/:id', adminOnly, uploadBanner.single('banner'), updateMeetup);
router.delete('/:id', adminOnly, deleteMeetup);

module.exports = router;
