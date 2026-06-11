const Message = require('../models/Message');
const Report = require('../models/Report');
const User = require('../models/User');
const { checkProfanity } = require('../utils/profanityFilter');

// @desc    Get conversations list
// @route   GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Auto-seed chats with other registered users if this user has no messages
    const messageCount = await Message.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    if (messageCount === 0) {
      const randomUsers = await User.find({ _id: { $ne: userId } }).limit(4);
      if (randomUsers.length > 0) {
        // Each conversation gets its own realistic thread
        const conversations = [
          [
            { from: 'them', text: "Hey! I noticed we're both in Peru Enti. What stack are you currently working with? 👋" },
            { from: 'me',   text: "Hi! I'm working with React + Node.js mostly. You?" },
            { from: 'them', text: "Nice! I'm on Next.js + FastAPI. We should catch up at the next meetup!" },
            { from: 'me',   text: "Definitely! Are you planning to attend the upcoming Design Systems talk?" },
            { from: 'them', text: "100%! Let's grab a seat together 🙌" }
          ],
          [
            { from: 'them', text: "Hi! Your profile says you're into UX design. I'm working on a design system — would love your input." },
            { from: 'me',   text: "Oh that's great! I've been building design systems for 2 years. Happy to chat." },
            { from: 'them', text: "Perfect. Are you available this weekend for a quick call?" },
            { from: 'me',   text: "Sunday works for me. Afternoon?" },
            { from: 'them', text: "Sunday 3PM it is! Sending the invite 📅" }
          ],
          [
            { from: 'them', text: "Welcome to the community! I'm Alice — I organise the frontend guild here." },
            { from: 'me',   text: "Thanks Alice! Excited to be here. How active is the community?" },
            { from: 'them', text: "Very active! We do bi-weekly meetups and monthly workshops." },
            { from: 'me',   text: "That sounds amazing. I'll definitely join the next one." },
            { from: 'them', text: "Great! Check the Meetups tab — there's one coming up next week 🚀" }
          ],
          [
            { from: 'them', text: "Hey, did you catch the React 19 keynote? Mind-blowing features!" },
            { from: 'me',   text: "Yes! The concurrent features and the new hooks are 🔥" },
            { from: 'them', text: "Especially useActionState — reduces so much boilerplate!" },
            { from: 'me',   text: "Exactly. I'm already migrating a project. Loving it so far." },
            { from: 'them', text: "Same! Let me know how it goes. Happy to review the PR if you want 👀" }
          ]
        ];

        for (let i = 0; i < Math.min(randomUsers.length, conversations.length); i++) {
          const partner = randomUsers[i];
          const thread = conversations[i];
          const baseTime = Date.now() - (i + 1) * 3 * 60 * 60 * 1000; // stagger per convo

          for (let j = 0; j < thread.length; j++) {
            const msg = thread[j];
            const sender = msg.from === 'them' ? partner._id : userId;
            const receiver = msg.from === 'them' ? userId : partner._id;
            await Message.create({
              sender,
              receiver,
              content: msg.text,
              read: true,
              createdAt: new Date(baseTime + j * 5 * 60 * 1000) // 5 min apart
            });
          }
        }
      }
    }

    // Find all unique conversation partners
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Populate user details
    const conversationIds = messages.map(m => m._id);
    const users = await User.find({ _id: { $in: conversationIds } })
      .select('name email profilePicture profession company isOnline');

    const conversations = messages.map(msg => {
      const user = users.find(u => u._id.toString() === msg._id.toString());
      return {
        user,
        lastMessage: msg.lastMessage,
        unreadCount: msg.unreadCount
      };
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages with a specific user
// @route   GET /api/messages/:userId
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
        read: false
      },
      { read: true }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    // Check if blocked
    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (receiver.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: 'You cannot send messages to this user' });
    }

    if (sender.blockedUsers.includes(receiverId)) {
      return res.status(403).json({ message: 'You have blocked this user. Unblock to send messages.' });
    }

    // Check for profanity
    const profanityCheck = checkProfanity(content);

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      flagged: profanityCheck.isHarmful
    });

    await message.populate('sender', 'name profilePicture');
    await message.populate('receiver', 'name profilePicture');

    const responseData = {
      ...message.toObject(),
      profanityDetected: profanityCheck.isHarmful,
      detectedWords: profanityCheck.detectedWords
    };

    if (req.io) {
      req.io.to(receiverId.toString()).emit('receive_message', responseData);
    }

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report a message/user
// @route   POST /api/messages/report
const reportMessage = async (req, res) => {
  try {
    const { reportedUserId, messageId, reason } = req.body;

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      message: messageId || null,
      reason
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getConversations, getMessages, sendMessage, reportMessage };
