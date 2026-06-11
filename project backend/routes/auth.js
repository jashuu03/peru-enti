const express = require('express');
const router = express.Router();
const { signup, signin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

router.post('/signup', uploadProfile.single('profilePicture'), signup);
router.post('/signin', signin);
router.get('/me', protect, getMe);

module.exports = router;
