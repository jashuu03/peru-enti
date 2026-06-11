const express = require('express');
const router = express.Router();
const {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getConnections,
  getPendingRequests,
  getConnectionStatus
} = require('../controllers/connectionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/request/:userId', sendConnectionRequest);
router.put('/:id/accept', acceptConnection);
router.put('/:id/reject', rejectConnection);
router.get('/', getConnections);
router.get('/pending', getPendingRequests);
router.get('/status/:userId', getConnectionStatus);

module.exports = router;
