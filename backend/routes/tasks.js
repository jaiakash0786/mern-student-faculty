const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Task = require('../models/Task');
const Group = require('../models/Group');
const User = require('../models/User');
const router = express.Router();

// Assign a new task (Faculty only)
router.post('/', auth, requireRole(['faculty', 'admin']), async (req, res) => {
  try {
    const { title, description, assignedTo, groupId, deadline, priority, tags } = req.body;

    // Validate required fields
    if (!title || !assignedTo || !groupId || !deadline) {
      return res.status(400).json({ 
        message: 'Title, assignedTo, groupId, and deadline are required' 
      });
    }

    // Check if faculty has access to the group
    const group = await Group.findById(groupId);
    const hasAccess = group.faculty.some(facultyId => 
      facultyId.toString() === req.user._id.toString()
    );

    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No access to this group' });
    }

    // Check if assignedTo user exists and is a student
    const student = await User.findById(assignedTo);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student assignment' });
    }

    // Check if student is in the group
    const isInGroup = group.members.some(member => 
      member.user.toString() === assignedTo
    );
    if (!isInGroup) {
      return res.status(400).json({ message: 'Student is not in this group' });
    }

    const task = new Task({
      title,
      description,
      assignedBy: req.user._id,
      assignedTo,
      groupId,
      deadline: new Date(deadline),
      priority: priority || 'medium',
      tags: tags || []
    });

    await task.save();
    await task.populate('assignedBy', 'name email');
    await task.populate('assignedTo', 'name email');
    await task.populate('groupId', 'name');

    res.status(201).json({
      message: 'Task assigned successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks for current user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { assignedTo: req.user._id };
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('assignedBy', 'name email')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks for a group (Faculty view)
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status } = req.query;

    // Check if user has access to the group
    const group = await Group.findById(groupId);
    const isFaculty = group.faculty.some(facultyId => 
      facultyId.toString() === req.user._id.toString()
    );
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isFaculty && !isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No access to this group' });
    }

    let query = { groupId };
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('groupId', 'name')
      .sort({ deadline: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task status (Student submission)
router.patch('/:taskId/status', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, submissionText } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is the assigned student
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    if (status === 'submitted') {
      task.status = 'submitted';
      task.submission = {
        text: submissionText || '',
        submittedAt: new Date()
      };
    } else if (['in-progress', 'pending'].includes(status)) {
      task.status = status;
    } else {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    await task.save();
    await task.populate('assignedBy', 'name email');
    await task.populate('assignedTo', 'name email');

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Faculty: Provide feedback and grade
router.patch('/:taskId/feedback', auth, requireRole(['faculty', 'admin']), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { feedback, grade, status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if faculty has access to this task's group
    const group = await Group.findById(task.groupId);
    const hasAccess = group.faculty.some(facultyId => 
      facultyId.toString() === req.user._id.toString()
    );

    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No access to this task' });
    }

    if (feedback) task.submission.feedback = feedback;
    if (grade !== undefined) task.submission.grade = grade;
    if (status && ['completed', 'rejected'].includes(status)) {
      task.status = status;
    }

    await task.save();
    await task.populate('assignedBy', 'name email');
    await task.populate('assignedTo', 'name email');

    res.json({
      message: 'Feedback submitted successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get task statistics
router.get('/stats/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const stats = await Task.aggregate([
      { $match: { groupId: mongoose.Types.ObjectId(groupId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments({ groupId });
    const completedTasks = await Task.countDocuments({ 
      groupId, 
      status: 'completed' 
    });

    res.json({
      statusDistribution: stats,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;