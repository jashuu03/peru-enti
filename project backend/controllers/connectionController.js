const Connection = require('../models/Connection');

// @desc    Send connection request
// @route   POST /api/connections/request/:userId
const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // Check if connection already exists
    const existing = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'Connection request already pending' });
      }
      if (existing.status === 'rejected') {
        // Allow re-requesting after rejection
        existing.status = 'pending';
        existing.requester = req.user._id;
        existing.recipient = userId;
        await existing.save();
        await existing.populate('requester recipient', 'name email profilePicture profession company');
        return res.json(existing);
      }
    }

    const connection = await Connection.create({
      requester: req.user._id,
      recipient: userId
    });

    await connection.populate('requester recipient', 'name email profilePicture profession company');

    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept connection request
// @route   PUT /api/connections/:id/accept
const acceptConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    connection.status = 'accepted';
    await connection.save();
    await connection.populate('requester recipient', 'name email profilePicture profession company');

    res.json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject connection request
// @route   PUT /api/connections/:id/reject
const rejectConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    connection.status = 'rejected';
    await connection.save();

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my connections
// @route   GET /api/connections
const getConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    }).populate('requester recipient', 'name email profilePicture profession company isOnline');

    // Map to get the other user in the connection
    const mappedConnections = connections.map(conn => {
      const otherUser = conn.requester._id.toString() === req.user._id.toString()
        ? conn.recipient
        : conn.requester;
      return {
        _id: conn._id,
        user: otherUser,
        connectedAt: conn.updatedAt
      };
    });

    res.json(mappedConnections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending connection requests
// @route   GET /api/connections/pending
const getPendingRequests = async (req, res) => {
  try {
    const incoming = await Connection.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'name email profilePicture profession company');

    const outgoing = await Connection.find({
      requester: req.user._id,
      status: 'pending'
    }).populate('recipient', 'name email profilePicture profession company');

    res.json({ incoming, outgoing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get connection status with a specific user
// @route   GET /api/connections/status/:userId
const getConnectionStatus = async (req, res) => {
  try {
    const connection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.user._id }
      ]
    });

    res.json({
      connectionId: connection?._id || null,
      status: connection?.status || 'none',
      isRequester: connection?.requester.toString() === req.user._id.toString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getConnections,
  getPendingRequests,
  getConnectionStatus
};
