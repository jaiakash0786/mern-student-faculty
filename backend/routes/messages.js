const express = require('express');
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const Group = require('../models/Group');
const router = express.Router();

// Get message history for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user has access to the group
    const group = await Group.findById(groupId);
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    const isFaculty = group.faculty.some(faculty => 
      faculty.toString() === req.user._id.toString()
    );

    if (!isMember && !isFaculty) {
      return res.status(403).json({ message: 'No access to this group' });
    }

    const messages = await Message.find({ groupId })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ groupId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search messages in a group
router.get('/search/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Check if user has access to the group
    const group = await Group.findById(groupId);
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    const isFaculty = group.faculty.some(faculty => 
      faculty.toString() === req.user._id.toString()
    );

    if (!isMember && !isFaculty) {
      return res.status(403).json({ message: 'No access to this group' });
    }

    const messages = await Message.find({
      groupId,
      content: { $regex: query, $options: 'i' }
    })
    .populate('sender', 'name email role')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;