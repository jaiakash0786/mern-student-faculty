
const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');
const router = express.Router();

// Debug middleware for groups
router.use((req, res, next) => {
  console.log(`Groups API: ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  console.log('Content-Type:', req.get('Content-Type'));
  next();
});

// Create a new group
router.post('/', auth, async (req, res) => {
  try {
    console.log('Create group request body:', req.body);
    
    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is missing' });
    }

    const { name, description, isPublic } = req.body;

    // Check if required fields are present
    if (!name) {
      return res.status(400).json({ 
        message: 'Group name is required',
        received: { name, description, isPublic }
      });
    }

    const group = new Group({
      name,
      description: description || '',
      createdBy: req.user._id,
      isPublic: isPublic || false,
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
    });

    await group.save();
    
    // Populate the created group with user details
    await group.populate('createdBy', 'name email');
    await group.populate('members.user', 'name email role');

    res.status(201).json({
      message: 'Group created successfully',
      group,
      inviteCode: group.inviteCode
    });
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});





// Get all groups (public or user's groups)
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { isPublic: true },
        { 'members.user': req.user._id }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email role')
    .populate('faculty', 'name email');

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single group by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role')
      .populate('faculty', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user has access to this group
    const isMember = group.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );
    const isFaculty = group.faculty.some(faculty => 
      faculty._id.toString() === req.user._id.toString()
    );

    if (!group.isPublic && !isMember && !isFaculty) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join group using invite code
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.inviteCode })
      .populate('members.user', 'name email role');

    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    // Add user to members
    group.members.push({
      user: req.user._id,
      role: 'member'
    });

    await group.save();
    await group.populate('members.user', 'name email role');

    res.json({
      message: 'Joined group successfully',
      group
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add faculty to group (only group admin can do this)
router.post('/:id/faculty', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is group admin
    const isAdmin = group.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only group admins can add faculty' });
    }

    const { facultyEmail } = req.body;

    // Find faculty user
    const facultyUser = await User.findOne({ 
      email: facultyEmail, 
      role: 'faculty' 
    });

    if (!facultyUser) {
      return res.status(404).json({ message: 'Faculty user not found' });
    }

    // Check if faculty is already added
    if (group.faculty.includes(facultyUser._id)) {
      return res.status(400).json({ message: 'Faculty already added to group' });
    }

    group.faculty.push(facultyUser._id);
    await group.save();
    
    await group.populate('faculty', 'name email');

    res.json({
      message: 'Faculty added successfully',
      group
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;




// ... keep the rest of your groups.js code the same ...