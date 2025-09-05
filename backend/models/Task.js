const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'submitted', 'completed', 'rejected'],
    default: 'pending'
  },
  deadline: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  submission: {
    text: {
      type: String,
      trim: true
    },
    file: {
      type: String // filename of submitted file
    },
    submittedAt: {
      type: Date
    },
    feedback: {
      type: String,
      trim: true
    },
    grade: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ groupId: 1, deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);