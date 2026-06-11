const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, getAllUsers, blockUser, unblockUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

router.use(protect);

router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.put('/profile', uploadProfile.single('profilePicture'), updateProfile);
router.post('/:id/block', blockUser);
router.delete('/:id/block', unblockUser);

module.exports = router;
