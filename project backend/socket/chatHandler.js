const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map(); // userId -> socketId

const socketHandler = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);
    
    // Map user to socket ID
    onlineUsers.set(userId, socket.id);
    
    // Join a private room for direct messages
    socket.join(userId);
    
    // Update online status in database
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      // Broadcast online status to all other users
      socket.broadcast.emit('user_status_change', { userId, isOnline: true });
    } catch (err) {
      console.error('[Socket] Error updating user status:', err.message);
    }

    // Typing indicators
    socket.on('typing', ({ receiverId }) => {
      io.to(receiverId).emit('typing_status', { senderId: userId, isTyping: true });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      io.to(receiverId).emit('typing_status', { senderId: userId, isTyping: false });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.user.name} (${userId})`);
      onlineUsers.delete(userId);
      
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        // Broadcast offline status
        socket.broadcast.emit('user_status_change', { userId, isOnline: false });
      } catch (err) {
        console.error('[Socket] Error updating status on disconnect:', err.message);
      }
    });
  });
};

module.exports = { socketHandler, onlineUsers };
