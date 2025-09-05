const express = require('express');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const File = require('../models/File');
const Group = require('../models/Group');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Upload file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { groupId, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!groupId) {
      // Delete the uploaded file if no groupId provided
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Group ID is required' });
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
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Access denied to this group' });
    }

    // Create file record
    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      groupId: groupId,
      description: description || ''
    });

    await file.save();
    await file.populate('uploadedBy', 'name email');
    await file.populate('groupId', 'name');

    res.status(201).json({
      message: 'File uploaded successfully',
      file
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get files for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if user has access to the group
    const group = await Group.findById(groupId);
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    const isFaculty = group.faculty.some(faculty => 
      faculty.toString() === req.user._id.toString()
    );

    if (!isMember && !isFaculty) {
      return res.status(403).json({ message: 'Access denied to this group' });
    }

    const files = await File.find({ groupId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download file
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the group
    const group = await Group.findById(file.groupId);
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    const isFaculty = group.faculty.some(faculty => 
      faculty.toString() === req.user._id.toString()
    );

    if (!isMember && !isFaculty) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    const filePath = path.join(__dirname, '../uploads', file.filename);

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    res.download(filePath, file.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete file
router.delete('/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is the uploader or faculty/admin
    const isUploader = file.uploadedBy.toString() === req.user._id.toString();
    const isFaculty = req.user.role === 'faculty' || req.user.role === 'admin';

    if (!isUploader && !isFaculty) {
      return res.status(403).json({ message: 'Only uploader or faculty can delete files' });
    }

    const filePath = path.join(__dirname, '../uploads', file.filename);
    
    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;