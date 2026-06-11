const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { socketHandler } = require('./socket/chatHandler');
const startVideoCleanupCron = require('./cron/videoCleanup');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Initialize Socket.io handler
socketHandler(io);

// Pass io to req object so controllers can emit socket events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folders for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/meetups', require('./routes/meetups'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Meetup Server is running smoothly' });
});

// Start video cleanup cron job
startVideoCleanupCron();

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
