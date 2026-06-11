const express = require('express');
const router = express.Router();
const { registerForMeetup, checkIn, getAttendees, getRegistrationStatus } = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', registerForMeetup);
router.post('/:meetupId/checkin', checkIn);
router.get('/:meetupId/attendees', getAttendees);
router.get('/:meetupId/status', getRegistrationStatus);

module.exports = router;
