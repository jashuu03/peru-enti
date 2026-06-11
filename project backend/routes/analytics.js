const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMeetupStats,
  exportAttendeesCSV,
  exportResponsesCSV
} = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

// Protect all analytics routes to admin only
router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/meetup/:id', getMeetupStats);
router.get('/export/attendees/:meetupId', exportAttendeesCSV);
router.get('/export/responses/:meetupId', exportResponsesCSV);

module.exports = router;
